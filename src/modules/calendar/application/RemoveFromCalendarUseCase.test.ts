import { describe, expect, it } from 'vitest';

import { RemoveFromCalendarUseCase } from './RemoveFromCalendarUseCase';
import { FakeCalendarRepository } from './testFakes';

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
