import { describe, expect, it } from 'vitest';

import type { CalendarEntry, CalendarEntryCreateInput } from '../domain/CalendarEntry';
import { DuplicateCalendarEntryError } from '../domain/DuplicateCalendarEntryError';
import type { CalendarRangeQuery, ICalendarRepository } from '../domain/ICalendarRepository';
import { ListCalendarEntriesUseCase } from './ListCalendarEntriesUseCase';

class FakeCalendarRepository implements ICalendarRepository {
  readonly entries: CalendarEntry[] = [];
  private nextId = 1;

  async add(input: CalendarEntryCreateInput): Promise<CalendarEntry> {
    const exists = this.entries.find(
      (e) =>
        e.userId === input.userId &&
        e.activityId === input.activityId &&
        e.scheduledAt.getTime() === input.scheduledAt.getTime(),
    );
    if (exists) {
      throw new DuplicateCalendarEntryError(input.userId, input.activityId, input.scheduledAt);
    }
    const entry: CalendarEntry = {
      id: `entry_${this.nextId++}`,
      userId: input.userId,
      activityId: input.activityId,
      scheduledAt: input.scheduledAt,
      notes: input.notes ?? null,
      createdAt: new Date('2026-05-06T00:00:00.000Z'),
    };
    this.entries.push(entry);
    return entry;
  }

  async removeById(_userId: string, _id: string): Promise<boolean> {
    return false;
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
}

describe('ListCalendarEntriesUseCase', () => {
  it('returns entries inside the range sorted by scheduledAt ascending', async () => {
    const calendar = new FakeCalendarRepository();
    await calendar.add({
      userId: 'user_1',
      activityId: 'a1',
      scheduledAt: new Date('2026-06-20T12:00:00Z'),
    });
    await calendar.add({
      userId: 'user_1',
      activityId: 'a2',
      scheduledAt: new Date('2026-06-05T08:00:00Z'),
    });
    await calendar.add({
      userId: 'user_1',
      activityId: 'a3',
      scheduledAt: new Date('2026-06-15T19:30:00Z'),
    });
    const useCase = new ListCalendarEntriesUseCase(calendar);

    const entries = await useCase.execute({
      userId: 'user_1',
      from: new Date('2026-06-01T00:00:00Z'),
      to: new Date('2026-06-30T23:59:59Z'),
    });

    expect(entries.map((e) => e.activityId)).toEqual(['a2', 'a3', 'a1']);
  });

  it('excludes entries outside the range', async () => {
    const calendar = new FakeCalendarRepository();
    await calendar.add({
      userId: 'user_1',
      activityId: 'a1',
      scheduledAt: new Date('2026-05-30T12:00:00Z'),
    });
    await calendar.add({
      userId: 'user_1',
      activityId: 'a2',
      scheduledAt: new Date('2026-07-01T12:00:00Z'),
    });
    const useCase = new ListCalendarEntriesUseCase(calendar);

    const entries = await useCase.execute({
      userId: 'user_1',
      from: new Date('2026-06-01T00:00:00Z'),
      to: new Date('2026-06-30T23:59:59Z'),
    });

    expect(entries).toEqual([]);
  });

  it('isolates by user', async () => {
    const calendar = new FakeCalendarRepository();
    await calendar.add({
      userId: 'user_1',
      activityId: 'a1',
      scheduledAt: new Date('2026-06-15T12:00:00Z'),
    });
    await calendar.add({
      userId: 'user_2',
      activityId: 'a2',
      scheduledAt: new Date('2026-06-15T12:00:00Z'),
    });
    const useCase = new ListCalendarEntriesUseCase(calendar);

    const entries = await useCase.execute({
      userId: 'user_1',
      from: new Date('2026-06-01T00:00:00Z'),
      to: new Date('2026-06-30T23:59:59Z'),
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].userId).toBe('user_1');
  });

  it('rejects an inverted range', async () => {
    const calendar = new FakeCalendarRepository();
    const useCase = new ListCalendarEntriesUseCase(calendar);

    await expect(
      useCase.execute({
        userId: 'user_1',
        from: new Date('2026-07-01T00:00:00Z'),
        to: new Date('2026-06-01T00:00:00Z'),
      }),
    ).rejects.toThrow();
  });
});
