import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { Activity } from '../../activities/domain/Activity';
import { PrismaActivityRepository } from '../../activities/infra/PrismaActivityRepository';
import { parseBody, parseQuery } from '../../../shared/api/parse';
import { getCurrentUser } from '../../../shared/auth/current-user';
import {
  toCalendarEntryDTO,
  type CalendarEntryActivitySummaryDTO,
  type CalendarEntryDTO,
} from '../../../shared/contracts/CalendarEntryDTO';
import { prisma } from '../../../shared/db/prisma';
import { AddToCalendarUseCase } from '../application/AddToCalendarUseCase';
import { ListCalendarEntriesUseCase } from '../application/ListCalendarEntriesUseCase';
import { RemoveBookmarkUseCase } from '../application/RemoveBookmarkUseCase';
import { CALENDAR_NOTES_MAX_LENGTH } from '../domain/CalendarEntry';
import { PrismaCalendarRepository } from '../infra/PrismaCalendarRepository';

const AddBodySchema = z.object({
  activityId: z.string().min(1),
  scheduledAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
    message: 'Invalid ISO timestamp',
  }),
  notes: z.string().max(CALENDAR_NOTES_MAX_LENGTH).nullable().optional(),
});

const RemoveBookmarkQuerySchema = z.object({
  activityId: z.string().min(1),
});

const RangeQuerySchema = z
  .object({
    from: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
      message: 'Invalid ISO timestamp for from',
    }),
    to: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
      message: 'Invalid ISO timestamp for to',
    }),
  })
  // Semantic validation lives in the schema — handlers don't repeat it, and the
  // failure becomes a ZodError → 400 automatically via handleApiError.
  .refine((q) => Date.parse(q.to) >= Date.parse(q.from), {
    message: '`to` must be greater than or equal to `from`',
    path: ['to'],
  });

export async function addToCalendarRouteHandler(request: Request): Promise<NextResponse> {
  const data = await parseBody(AddBodySchema, request);
  const user = await getCurrentUser();
  const useCase = new AddToCalendarUseCase(
    new PrismaCalendarRepository(prisma),
    new PrismaActivityRepository(prisma),
  );

  const entry = await useCase.execute({
    userId: user.id,
    activityId: data.activityId,
    scheduledAt: new Date(data.scheduledAt),
    notes: data.notes ?? null,
  });
  return NextResponse.json(toCalendarEntryDTO(entry), { status: 201 });
}

export async function removeBookmarkRouteHandler(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const { activityId } = parseQuery(RemoveBookmarkQuerySchema, url.searchParams);
  const user = await getCurrentUser();
  const useCase = new RemoveBookmarkUseCase(new PrismaCalendarRepository(prisma));
  const result = await useCase.execute(user.id, activityId);
  return NextResponse.json(result);
}

export async function listCalendarEntriesRouteHandler(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const data = parseQuery(RangeQuerySchema, url.searchParams);

  const user = await getCurrentUser();
  const useCase = new ListCalendarEntriesUseCase(new PrismaCalendarRepository(prisma));
  const entries = await useCase.execute({
    userId: user.id,
    from: new Date(data.from),
    to: new Date(data.to),
  });

  const activityIds = Array.from(new Set(entries.map((e) => e.activityId)));
  const activities = await new PrismaActivityRepository(prisma).findByIds(activityIds);
  const activityById = new Map(activities.map((a) => [a.id, a]));

  const body: CalendarEntryDTO[] = entries.map((entry) =>
    toCalendarEntryDTO(entry, toActivitySummary(activityById.get(entry.activityId))),
  );
  return NextResponse.json(body);
}

function toActivitySummary(activity: Activity | undefined): CalendarEntryActivitySummaryDTO | null {
  if (!activity) return null;
  return { slug: activity.slug, title: activity.title, imageUrl: activity.imageUrl, kind: activity.kind };
}
