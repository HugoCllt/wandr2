import { describe, expect, it } from 'vitest';

import { ListCalendarEntriesUseCase } from './ListCalendarEntriesUseCase';
import { FakeCalendarRepository } from './testFakes';

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
