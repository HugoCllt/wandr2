import { NextResponse } from 'next/server';
import { z } from 'zod';

import { parseBody, parseQuery } from '../../../shared/api/parse';
import { env } from '../../../shared/config/env';
import { prisma } from '../../../shared/db/prisma';
import { ConfirmActivityUseCase } from '../application/ConfirmActivityUseCase';
import { ListAgentActivitiesUseCase } from '../application/ListAgentActivitiesUseCase';
import { PromoteCandidateUseCase } from '../application/PromoteCandidateUseCase';
import { ActivityCategories, ActivityKinds, type Activity } from '../domain/Activity';
import { ActivityNotFoundError } from '../domain/ActivityNotFoundError';
import type { ExtractedActivityPayload } from '../domain/RawActivityCandidate';
import { PrismaActivityRepository } from '../infra/PrismaActivityRepository';
import { PrismaCandidateRepository } from '../infra/PrismaCandidateRepository';
import { PrismaCityRepository } from '../infra/PrismaCityRepository';

/**
 * Agent API — HTTP edge for external agent runtimes (SuperMes/Hermes scouts).
 * Same application layer as the MCP ingestion server (src/mcp): the MCP tools
 * and these routes are two edges over the same use cases. Auth is a dedicated
 * bearer token (AGENT_API_TOKEN), separate from ADMIN_TOKEN so it can be
 * rotated/revoked independently of human admin access.
 */

function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function agentTokenValid(request: Request): boolean {
  // Empty env token = agent API disabled (boots fine without it).
  if (!env.AGENT_API_TOKEN) return false;
  return request.headers.get('authorization') === `Bearer ${env.AGENT_API_TOKEN}`;
}

// ---------------------------------------------------------------------------
// GET /api/agent/activities — read path for recommendation agents
// ---------------------------------------------------------------------------

const ListQuerySchema = z.object({
  citySlug: z.string().min(1),
  // CSV of categories, e.g. "CULTURE,NIGHTLIFE"
  categories: z
    .string()
    .transform((s) => s.split(',').filter(Boolean))
    .pipe(z.array(z.enum(ActivityCategories)))
    .optional(),
  kind: z.enum(ActivityKinds).optional(),
  priceMaxCents: z.coerce.number().int().nonnegative().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

// Compact projection: enough for an agent to recommend and link out, without
// shipping internal bookkeeping (dedupeKey, source, freshness timestamps).
function toAgentActivity(a: Activity) {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    description: a.description,
    kind: a.kind,
    categories: a.categories,
    address: a.address,
    neighborhood: a.neighborhood,
    latitude: a.latitude,
    longitude: a.longitude,
    dateStart: a.dateStart ? a.dateStart.toISOString() : null,
    dateEnd: a.dateEnd ? a.dateEnd.toISOString() : null,
    priceMinCents: a.priceMinCents,
    priceMaxCents: a.priceMaxCents,
    externalUrl: a.externalUrl,
    imageUrl: a.imageUrl,
    indoor: a.indoor,
    outdoor: a.outdoor,
  };
}

export async function getAgentActivities(request: Request): Promise<NextResponse> {
  if (!agentTokenValid(request)) return unauthorized();

  const query = parseQuery(ListQuerySchema, new URL(request.url).searchParams);

  const city = await new PrismaCityRepository(prisma).findBySlug(query.citySlug);
  if (!city) {
    return NextResponse.json({ error: `Unknown city: ${query.citySlug}` }, { status: 400 });
  }

  if ((query.from && !query.to) || (!query.from && query.to)) {
    return NextResponse.json({ error: 'from and to must be provided together' }, { status: 400 });
  }

  const useCase = new ListAgentActivitiesUseCase(new PrismaActivityRepository(prisma));
  const activities = await useCase.execute({
    cityId: city.id,
    now: new Date(),
    categories: query.categories,
    kind: query.kind,
    priceMaxCents: query.priceMaxCents,
    eventDateWindow:
      query.from && query.to ? { from: new Date(query.from), to: new Date(query.to) } : undefined,
    limit: query.limit,
  });

  return NextResponse.json({ city: query.citySlug, count: activities.length, activities: activities.map(toAgentActivity) });
}

// ---------------------------------------------------------------------------
// POST /api/agent/candidates — write path (mirror of the MCP ingestActivity
// tool: stage every candidate for the audit trail, then promote)
// ---------------------------------------------------------------------------

// Layer A (structural) — kept byte-compatible with src/mcp/tools/ingestActivity.ts
// so scouts can target either edge with the same payload. Business rules stay
// in the domain (Layer B → REJECTED + reason).
const PayloadSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  kind: z.enum(ActivityKinds),
  categories: z.object({
    primary: z.enum(ActivityCategories),
    secondary: z.array(z.enum(ActivityCategories)).max(2).default([]),
  }),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  priceMinCents: z.number().int().nonnegative(),
  indoor: z.boolean(),
  outdoor: z.boolean(),
  imageUrl: z.string().url().nullable().default(null),
  neighborhood: z.string().nullable().default(null),
  dateStart: z.string().datetime().nullable().default(null),
  dateEnd: z.string().datetime().nullable().default(null),
  priceMaxCents: z.number().int().nonnegative().nullable().default(null),
  externalUrl: z.string().url().nullable().default(null),
});

const CandidateBodySchema = z.object({
  citySlug: z.string().min(1),
  payload: PayloadSchema,
  meta: z.object({
    agentName: z.string().min(1),
    searchQuery: z.string().min(1),
    sourceUrl: z.string().url(),
    rawExcerpt: z.string().min(1),
    category: z.enum(ActivityCategories),
  }),
});

// Staging sentinel — the authoritative dedupeKey is (re)computed inside
// PromoteCandidateUseCase (same rationale as the MCP tool: stage EVERY
// candidate, even future rejects, before judging it).
const STAGED_DEDUPE_KEY = 'pending-promotion';

export async function postAgentCandidate(request: Request): Promise<NextResponse> {
  if (!agentTokenValid(request)) return unauthorized();

  const body = await parseBody(CandidateBodySchema, request);

  const cities = new PrismaCityRepository(prisma);
  const city = await cities.findBySlug(body.citySlug);
  if (!city) {
    // Unknown city is bad DATA, not a bad call → REJECTED, nothing staged.
    return NextResponse.json(
      { outcome: 'REJECTED', activityId: null, reason: `Unknown city: ${body.citySlug}` },
      { status: 200 },
    );
  }

  const activities = new PrismaActivityRepository(prisma);
  const candidates = new PrismaCandidateRepository(prisma);
  const payload: ExtractedActivityPayload = body.payload;

  const candidate = await candidates.create({
    cityId: city.id,
    category: body.meta.category,
    agentName: body.meta.agentName,
    searchQuery: body.meta.searchQuery,
    sourceUrl: body.meta.sourceUrl,
    rawExcerpt: body.meta.rawExcerpt,
    extractedPayload: payload,
    dedupeKey: STAGED_DEDUPE_KEY,
  });

  const promote = new PromoteCandidateUseCase(activities, activities, candidates, cities);
  const result = await promote.execute({ candidateId: candidate.id, now: new Date() });

  return NextResponse.json(result, { status: result.outcome === 'PROMOTED' ? 201 : 200 });
}

// ---------------------------------------------------------------------------
// GET /api/agent/recheck-due — snapshot of PLACEs due for re-verification
// ---------------------------------------------------------------------------

const RecheckQuerySchema = z.object({
  citySlug: z.string().min(1),
  limit: z.coerce.number().int().positive().optional(),
});

export async function getAgentRecheckDue(request: Request): Promise<NextResponse> {
  if (!agentTokenValid(request)) return unauthorized();

  const query = parseQuery(RecheckQuerySchema, new URL(request.url).searchParams);

  const city = await new PrismaCityRepository(prisma).findBySlug(query.citySlug);
  if (!city) {
    return NextResponse.json({ error: `Unknown city: ${query.citySlug}` }, { status: 400 });
  }

  const activities = new PrismaActivityRepository(prisma);
  const due = await activities.findDueForRecheck(city.id, new Date(), query.limit);

  return NextResponse.json({
    city: query.citySlug,
    count: due.length,
    activities: due.map((a) => ({
      id: a.id,
      title: a.title,
      kind: a.kind,
      address: a.address,
      latitude: a.latitude,
      longitude: a.longitude,
      externalUrl: a.externalUrl,
      lastVerifiedAt: a.lastVerifiedAt ? a.lastVerifiedAt.toISOString() : null,
    })),
  });
}

// ---------------------------------------------------------------------------
// POST /api/agent/activities/[id]/confirm | archive — recheck decisions
// ---------------------------------------------------------------------------

export async function postAgentConfirm(
  request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  if (!agentTokenValid(request)) return unauthorized();

  const activities = new PrismaActivityRepository(prisma);
  const existing = await activities.findById(context.params.id);
  if (!existing) throw new ActivityNotFoundError(context.params.id);

  const confirm = new ConfirmActivityUseCase(activities, activities);
  const { recheckAfter } = await confirm.execute({
    activityId: context.params.id,
    now: new Date(),
  });

  return NextResponse.json({
    id: context.params.id,
    recheckAfter: recheckAfter ? recheckAfter.toISOString() : null,
  });
}

export async function postAgentArchive(
  request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  if (!agentTokenValid(request)) return unauthorized();

  const activities = new PrismaActivityRepository(prisma);
  const existing = await activities.findById(context.params.id);
  if (!existing) throw new ActivityNotFoundError(context.params.id);

  await activities.archive(context.params.id);
  return NextResponse.json({ id: context.params.id, status: 'ARCHIVED' });
}
