import { NextResponse } from 'next/server';
import { z } from 'zod';

import { PrismaActivityRepository } from '../../activities/infra/PrismaActivityRepository';
import { parseBody, parseQuery } from '../../../shared/api/parse';
import { getCurrentUser } from '../../../shared/auth/current-user';
import {
  toCalendarEntryDTO,
  type CalendarEntryDTO,
} from '../../../shared/contracts/CalendarEntryDTO';
import { prisma } from '../../../shared/db/prisma';
import { AddToCalendarUseCase } from '../application/AddToCalendarUseCase';
import { ListCalendarEntriesUseCase } from '../application/ListCalendarEntriesUseCase';
import { CALENDAR_NOTES_MAX_LENGTH } from '../domain/CalendarEntry';
import { PrismaCalendarRepository } from '../infra/PrismaCalendarRepository';

const AddBodySchema = z.object({
  activityId: z.string().min(1),
  scheduledAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
    message: 'Invalid ISO timestamp',
  }),
  notes: z.string().max(CALENDAR_NOTES_MAX_LENGTH).nullable().optional(),
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
  const body: CalendarEntryDTO[] = entries.map(toCalendarEntryDTO);
  return NextResponse.json(body);
}
