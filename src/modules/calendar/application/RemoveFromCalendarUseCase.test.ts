import { describe, expect, it } from 'vitest';

import type { CalendarEntry, CalendarEntryCreateInput } from '../domain/CalendarEntry';
import { DuplicateCalendarEntryError } from '../domain/DuplicateCalendarEntryError';
import type { CalendarRangeQuery, ICalendarRepository } from '../domain/ICalendarRepository';
import { RemoveFromCalendarUseCase } from './RemoveFromCalendarUseCase';

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

  async removeById(userId: string, id: string): Promise<boolean> {
    const idx = this.entries.findIndex((e) => e.userId === userId && e.id === id);
    if (idx === -1) return false;
    this.entries.splice(idx, 1);
    return true;
  }

  async listInRange(_query: CalendarRangeQuery): Promise<CalendarEntry[]> {
    return [];
  }
}

describe('RemoveFromCalendarUseCase', () => {
  it('removes an existing entry and reports `removed: true`', async () => {
    const calendar = new FakeCalendarRepository();
    const created = await calendar.add({
      userId: 'user_1',
      activityId: 'activity_1',
      scheduledAt: new Date('2026-06-15T19:30:00Z'),
    });
    const useCase = new RemoveFromCalendarUseCase(calendar);

    const result = await useCase.execute('user_1', created.id);

    expect(result.removed).toBe(true);
    expect(calendar.entries).toHaveLength(0);
  });

  it('returns `removed: false` silently when the entry does not exist', async () => {
    const calendar = new FakeCalendarRepository();
    const useCase = new RemoveFromCalendarUseCase(calendar);

    const result = await useCase.execute('user_1', 'unknown_id');

    expect(result.removed).toBe(false);
  });

  it("does not remove another user's entry", async () => {
    const calendar = new FakeCalendarRepository();
    const created = await calendar.add({
      userId: 'user_2',
      activityId: 'activity_1',
      scheduledAt: new Date('2026-06-15T19:30:00Z'),
    });
    const useCase = new RemoveFromCalendarUseCase(calendar);

    const result = await useCase.execute('user_1', created.id);

    expect(result.removed).toBe(false);
    expect(calendar.entries).toHaveLength(1);
  });
});
