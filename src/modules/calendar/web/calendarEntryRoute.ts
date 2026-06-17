import { NextResponse } from 'next/server';
import { z } from 'zod';

import { PrismaActivityRepository } from '../../activities/infra/PrismaActivityRepository';
import { PrismaAffinityRepository } from '../../affinity/infra/PrismaAffinityRepository';
import { parseBody } from '../../../shared/api/parse';
import { getCurrentUser } from '../../../shared/auth/current-user';
import { toCalendarEntryDTO } from '../../../shared/contracts/CalendarEntryDTO';
import { prisma } from '../../../shared/db/prisma';
import { RemoveFromCalendarUseCase } from '../application/RemoveFromCalendarUseCase';
import { ReviewCalendarEntryUseCase } from '../application/ReviewCalendarEntryUseCase';
import { CALENDAR_REVIEW_NOTE_MAX_LENGTH } from '../domain/CalendarEntry';
import { PrismaCalendarRepository } from '../infra/PrismaCalendarRepository';

const ReviewBodySchema = z.object({
  outcome: z.enum(['DONE', 'MISSED']),
  satisfaction: z.number().int().min(1).max(5).nullable().optional(),
  reviewNote: z.string().max(CALENDAR_REVIEW_NOTE_MAX_LENGTH).nullable().optional(),
});

export async function deleteCalendarEntryRouteHandler(
  _request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  // Next.js only routes here when the [id] segment is non-empty, so no explicit
  // missing-id check is needed. A blank slug would 404 at the routing layer.
  const user = await getCurrentUser();
  const useCase = new RemoveFromCalendarUseCase(new PrismaCalendarRepository(prisma));
  await useCase.execute(user.id, context.params.id);
  return new NextResponse(null, { status: 204 });
}

export async function reviewCalendarEntryRouteHandler(
  request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  const data = await parseBody(ReviewBodySchema, request);
  const user = await getCurrentUser();
  const useCase = new ReviewCalendarEntryUseCase(
    new PrismaCalendarRepository(prisma),
    new PrismaActivityRepository(prisma),
    new PrismaAffinityRepository(prisma),
  );
  const entry = await useCase.execute({
    userId: user.id,
    entryId: context.params.id,
    outcome: data.outcome,
    satisfaction: data.satisfaction ?? null,
    reviewNote: data.reviewNote ?? null,
  });
  return NextResponse.json(toCalendarEntryDTO(entry));
}
