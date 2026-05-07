import type { CalendarEntry as PrismaCalendarEntry, Prisma, PrismaClient } from '@prisma/client';

import type { CalendarEntry, CalendarEntryCreateInput } from '../domain/CalendarEntry';
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
        throw new DuplicateCalendarEntryError(input.userId, input.activityId, input.scheduledAt);
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
}

function toCalendarEntry(row: PrismaCalendarEntry): CalendarEntry {
  return {
    id: row.id,
    userId: row.userId,
    activityId: row.activityId,
    scheduledAt: row.scheduledAt,
    notes: row.notes,
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
