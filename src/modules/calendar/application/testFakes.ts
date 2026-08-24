import type {
  CalendarEntry,
  CalendarEntryCreateInput,
  CalendarReviewInput,
} from '../domain/CalendarEntry';
import { DuplicateCalendarEntryError } from '../domain/DuplicateCalendarEntryError';
import type { CalendarRangeQuery, ICalendarRepository } from '../domain/ICalendarRepository';

/** In-memory ICalendarRepository for use-case unit tests. */
export class FakeCalendarRepository implements ICalendarRepository {
  readonly entries: CalendarEntry[] = [];
  private nextId = 1;

  async add(input: CalendarEntryCreateInput): Promise<CalendarEntry> {
    const exists = this.entries.find(
      (e) => e.userId === input.userId && e.activityId === input.activityId,
    );
    if (exists) {
      throw new DuplicateCalendarEntryError(input.userId, input.activityId);
    }
    const entry: CalendarEntry = {
      id: `entry_${this.nextId++}`,
      userId: input.userId,
      activityId: input.activityId,
      scheduledAt: input.scheduledAt,
      notes: input.notes ?? null,
      outcome: 'PENDING',
      satisfaction: null,
      reviewNote: null,
      reviewedAt: null,
      createdAt: new Date('2026-05-06T00:00:00.000Z'),
    };
    this.entries.push(entry);
    return entry;
  }

  async removeById(userId: string, id: string): Promise<boolean> {
    const idx = this.entries.findIndex((e) => e.userId === userId && e.id === id);
    if (idx === -1) return false;
    this.entries.splice(idx, 1);
    return true;
  }

  async removeByActivityId(userId: string, activityId: string): Promise<boolean> {
    const idx = this.entries.findIndex(
      (e) => e.userId === userId && e.activityId === activityId,
    );
    if (idx === -1) return false;
    this.entries.splice(idx, 1);
    return true;
  }

  async listInRange(query: CalendarRangeQuery): Promise<CalendarEntry[]> {
    return this.entries
      .filter(
        (e) =>
          e.userId === query.userId &&
          e.scheduledAt.getTime() >= query.from.getTime() &&
          e.scheduledAt.getTime() <= query.to.getTime(),
      )
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  async listActivityIdsForUser(userId: string): Promise<string[]> {
    return this.entries.filter((e) => e.userId === userId).map((e) => e.activityId);
  }

  async isBookmarked(userId: string, activityId: string): Promise<boolean> {
    return this.entries.some((e) => e.userId === userId && e.activityId === activityId);
  }

  async listPendingReviews(userId: string, before: Date, limit: number): Promise<CalendarEntry[]> {
    return this.entries
      .filter(
        (e) =>
          e.userId === userId &&
          e.outcome === 'PENDING' &&
          e.scheduledAt.getTime() < before.getTime(),
      )
      .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
      .slice(0, limit);
  }

  async review(
    userId: string,
    id: string,
    input: CalendarReviewInput,
  ): Promise<CalendarEntry | null> {
    const entry = this.entries.find((e) => e.userId === userId && e.id === id);
    if (!entry) return null;
    entry.outcome = input.outcome;
    entry.satisfaction = input.satisfaction ?? null;
    entry.reviewNote = input.reviewNote ?? null;
    entry.reviewedAt = new Date('2026-05-07T00:00:00.000Z');
    return entry;
  }
}
