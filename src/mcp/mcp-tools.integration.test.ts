import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { ExtractedActivityPayload } from '../modules/activities/domain/RawActivityCandidate';
import { prisma } from '../shared/db/prisma';
import { createDeps } from './deps';
import { confirmActivity } from './tools/confirmActivity';
import { ingestActivity } from './tools/ingestActivity';
import { listActivitiesDueForRecheck } from './tools/listActivitiesDueForRecheck';

const DAY = 24 * 60 * 60 * 1000;
const CITY_SLUG = 'mcp-it-tools';
const AGENT = 'mcp-it-tools-agent';

let cityId: string;
// Mutable clock shared by all four bundles; advancing it lets us cross recheck
// deadlines deterministically (createDeps reads it lazily per call).
let clock = new Date('2026-05-23T12:00:00.000Z');
const deps = createDeps(prisma, () => clock);

function payload(overrides: Partial<ExtractedActivityPayload> = {}): ExtractedActivityPayload {
  return {
    title: 'IT Bagel',
    description: 'Test bagels.',
    imageUrl: 'https://example.com/bagel.jpg',
    imageCredit: null,
    kind: 'PLACE',
    category: 'FOOD',
    address: '1 Rue Test, Montreal, QC',
    neighborhood: 'Mile End',
    latitude: 45.5227,
    longitude: -73.6016,
    dateStart: null,
    dateEnd: null,
    priceMinCents: 200,
    priceMaxCents: null,
    externalUrl: 'https://example.com/it-bagel',
    indoor: true,
    outdoor: false,
    tags: ['FOOD'],
    ...overrides,
  };
}

function meta() {
  return {
    agentName: AGENT,
    searchQuery: 'best bagels montreal',
    sourceUrl: 'https://example.com/article',
    rawExcerpt: 'IT Bagel is a test fixture...',
    category: 'FOOD' as const,
  };
}

beforeAll(async () => {
  const city = await prisma.city.upsert({
    where: { slug: CITY_SLUG },
    update: {},
    create: {
      slug: CITY_SLUG,
      name: 'MCP IT Tools City',
      country: 'CA',
      timezone: 'America/Toronto',
      centerLat: 45.5019,
      centerLng: -73.5674,
      bboxMinLat: 45.4,
      bboxMinLng: -73.98,
      bboxMaxLat: 45.71,
      bboxMaxLng: -73.47,
    },
  });
  cityId = city.id;

  // Defensive: clear any rows a previous crashed run left in this isolated city.
  await prisma.rawActivityCandidate.deleteMany({ where: { cityId } });
  await prisma.activity.deleteMany({ where: { cityId } });
});

afterEach(async () => {
  clock = new Date('2026-05-23T12:00:00.000Z');
  await prisma.rawActivityCandidate.deleteMany({ where: { cityId } });
  await prisma.activity.deleteMany({ where: { cityId } });
});

afterAll(async () => {
  await prisma.source.deleteMany({ where: { name: AGENT } });
  await prisma.city.deleteMany({ where: { id: cityId } });
  await prisma.$disconnect();
});

describe('MCP ingestion flow (integration)', () => {
  it('PROMOTED on first ingest, DUPLICATE (same activity) on re-ingest of the same payload', async () => {
    const first = await ingestActivity(deps.ingest, {
      citySlug: CITY_SLUG,
      payload: payload(),
      meta: meta(),
    });
    expect(first.outcome).toBe('PROMOTED');
    expect(first.activityId).not.toBeNull();

    const second = await ingestActivity(deps.ingest, {
      citySlug: CITY_SLUG,
      payload: payload(),
      meta: meta(),
    });
    expect(second.outcome).toBe('DUPLICATE');
    expect(second.activityId).toBe(first.activityId);

    const rows = await prisma.activity.count({ where: { cityId } });
    expect(rows).toBe(1);
  });
});

describe('MCP recheck flow (integration)', () => {
  it('lists due (ordered, bounded), confirm pushes recheckAfter so a re-list does not overlap', async () => {
    // Three distinct PLACEs ingested at the same clock → identical recheckAfter,
    // so list ordering falls to the id tiebreaker; we assert on membership.
    const ids: string[] = [];
    for (const title of ['IT Bagel A', 'IT Bagel B', 'IT Bagel C']) {
      const r = await ingestActivity(deps.ingest, {
        citySlug: CITY_SLUG,
        payload: payload({ title, externalUrl: `https://example.com/${title}` }),
        meta: meta(),
      });
      expect(r.outcome).toBe('PROMOTED');
      ids.push(r.activityId as string);
    }

    // Nothing is due yet (recheckAfter = now + 90d).
    expect(await listActivitiesDueForRecheck(deps.list, { citySlug: CITY_SLUG })).toHaveLength(0);

    // Fast-forward past the 90-day PLACE deadline.
    clock = new Date(clock.getTime() + 100 * DAY);

    const dueLimited = await listActivitiesDueForRecheck(deps.list, {
      citySlug: CITY_SLUG,
      limit: 2,
    });
    expect(dueLimited).toHaveLength(2);
    expect(dueLimited[0]).toHaveProperty('lastVerifiedAt');
    expect(typeof dueLimited[0].lastVerifiedAt).toBe('string');

    const dueAll = await listActivitiesDueForRecheck(deps.list, { citySlug: CITY_SLUG });
    expect(dueAll.map((d) => d.id).sort()).toEqual([...ids].sort());

    // Confirm one; its deadline moves to clock + 90d (future relative to clock).
    const confirmed = await confirmActivity(deps.confirm, { activityId: ids[0] });
    expect(confirmed.recheckAfter).not.toBeNull();

    // A fresh list at the same clock must NOT include the confirmed id (no overlap).
    const dueAfter = await listActivitiesDueForRecheck(deps.list, { citySlug: CITY_SLUG });
    expect(dueAfter.map((d) => d.id)).not.toContain(ids[0]);
    expect(dueAfter.map((d) => d.id).sort()).toEqual([ids[1], ids[2]].sort());
  });
});
