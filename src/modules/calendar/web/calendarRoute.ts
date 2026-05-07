import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ActivityNotFoundError } from '../../activities/domain/ActivityNotFoundError';
import { PrismaActivityRepository } from '../../activities/infra/PrismaActivityRepository';
import { getCurrentUser } from '../../../shared/auth/current-user';
import {
  toCalendarEntryDTO,
  type CalendarEntryDTO,
} from '../../../shared/contracts/CalendarEntryDTO';
import { prisma } from '../../../shared/db/prisma';
import { AddToCalendarUseCase } from '../application/AddToCalendarUseCase';
import { ListCalendarEntriesUseCase } from '../application/ListCalendarEntriesUseCase';
import { CALENDAR_NOTES_MAX_LENGTH } from '../domain/CalendarEntry';
import { DuplicateCalendarEntryError } from '../domain/DuplicateCalendarEntryError';
import { PrismaCalendarRepository } from '../infra/PrismaCalendarRepository';

const AddBodySchema = z.object({
  activityId: z.string().min(1),
  scheduledAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
    message: 'Invalid ISO timestamp',
  }),
  notes: z.string().max(CALENDAR_NOTES_MAX_LENGTH).nullable().optional(),
});

const RangeQuerySchema = z.object({
  from: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
    message: 'Invalid ISO timestamp for from',
  }),
  to: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
    message: 'Invalid ISO timestamp for to',
  }),
});

export async function addToCalendarRouteHandler(request: Request): Promise<NextResponse> {
  const json = await request.json().catch(() => null);
  const parsed = AddBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const user = await getCurrentUser();
  const useCase = new AddToCalendarUseCase(
    new PrismaCalendarRepository(prisma),
    new PrismaActivityRepository(prisma),
  );

  try {
    const entry = await useCase.execute({
      userId: user.id,
      activityId: parsed.data.activityId,
      scheduledAt: new Date(parsed.data.scheduledAt),
      notes: parsed.data.notes ?? null,
    });
    return NextResponse.json(toCalendarEntryDTO(entry), { status: 201 });
  } catch (error) {
    if (error instanceof ActivityNotFoundError) {
      return NextResponse.json(
        { error: 'Activity not found', activityId: parsed.data.activityId },
        { status: 404 },
      );
    }
    if (error instanceof DuplicateCalendarEntryError) {
      return NextResponse.json(
        { error: 'Calendar entry already exists at this time' },
        { status: 409 },
      );
    }
    throw error;
  }
}

export async function listCalendarEntriesRouteHandler(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const parsed = RangeQuerySchema.safeParse({
    from: url.searchParams.get('from'),
    to: url.searchParams.get('to'),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const user = await getCurrentUser();
  const useCase = new ListCalendarEntriesUseCase(new PrismaCalendarRepository(prisma));
  const from = new Date(parsed.data.from);
  const to = new Date(parsed.data.to);
  if (to.getTime() < from.getTime()) {
    return NextResponse.json(
      { error: '`to` must be greater than or equal to `from`' },
      { status: 400 },
    );
  }
  const entries = await useCase.execute({ userId: user.id, from, to });
  const body: CalendarEntryDTO[] = entries.map(toCalendarEntryDTO);
  return NextResponse.json(body);
}
