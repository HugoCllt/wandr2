import type { CalendarEntry as PrismaCalendarEntry, Prisma, PrismaClient } from '@prisma/client';

import type {
  CalendarEntry,
  CalendarEntryCreateInput,
  CalendarReviewInput,
} from '../domain/CalendarEntry';
import { DuplicateCalendarEntryError } from '../domain/DuplicateCalendarEntryError';
import type { CalendarRangeQuery, ICalendarRepository } from '../domain/ICalendarRepository';

const UNIQUE_VIOLATION = 'P2002';

export class PrismaCalendarRepository implements ICalendarRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async add(input: CalendarEntryCreateInput): Promise<CalendarEntry> {
    try {
      const created = await this.prisma.calendarEntry.create({
        data: {
          userId: input.userId,
          activityId: input.activityId,
          scheduledAt: input.scheduledAt,
          notes: input.notes ?? null,
        },
      });
      return toCalendarEntry(created);
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        throw new DuplicateCalendarEntryError(input.userId, input.activityId);
      }
      throw error;
    }
  }

  async removeById(userId: string, id: string): Promise<boolean> {
    const result = await this.prisma.calendarEntry.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }

  async removeByActivityId(userId: string, activityId: string): Promise<boolean> {
    const result = await this.prisma.calendarEntry.deleteMany({
      where: { userId, activityId },
    });
    return result.count > 0;
  }

  async listInRange(query: CalendarRangeQuery): Promise<CalendarEntry[]> {
    const rows = await this.prisma.calendarEntry.findMany({
      where: {
        userId: query.userId,
        scheduledAt: { gte: query.from, lte: query.to },
      },
      orderBy: { scheduledAt: 'asc' },
    });
    return rows.map(toCalendarEntry);
  }

  async listActivityIdsForUser(userId: string): Promise<string[]> {
    const rows = await this.prisma.calendarEntry.findMany({
      where: { userId },
      select: { activityId: true },
    });
    return rows.map((r) => r.activityId);
  }

  async listPendingReviews(userId: string, before: Date, limit: number): Promise<CalendarEntry[]> {
    const rows = await this.prisma.calendarEntry.findMany({
      where: { userId, outcome: 'PENDING', scheduledAt: { lt: before } },
      orderBy: { scheduledAt: 'desc' },
      take: limit,
    });
    return rows.map(toCalendarEntry);
  }

  async review(
    userId: string,
    id: string,
    input: CalendarReviewInput,
  ): Promise<CalendarEntry | null> {
    const result = await this.prisma.calendarEntry.updateMany({
      where: { id, userId },
      data: {
        outcome: input.outcome,
        satisfaction: input.satisfaction ?? null,
        reviewNote: input.reviewNote ?? null,
        reviewedAt: new Date(),
      },
    });
    if (result.count === 0) return null;
    const row = await this.prisma.calendarEntry.findUnique({ where: { id } });
    return row ? toCalendarEntry(row) : null;
  }
}

function toCalendarEntry(row: PrismaCalendarEntry): CalendarEntry {
  return {
    id: row.id,
    userId: row.userId,
    activityId: row.activityId,
    scheduledAt: row.scheduledAt,
    notes: row.notes,
    outcome: row.outcome,
    satisfaction: row.satisfaction,
    reviewNote: row.reviewNote,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt,
  };
}

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as Prisma.PrismaClientKnownRequestError).code === UNIQUE_VIOLATION
  );
}
