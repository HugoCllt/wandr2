import { describe, expect, it } from 'vitest';

import type { CalendarEntry } from '../core/CalendarEntry';
import { toCalendarEntryDTO } from './CalendarEntryDTO';

const ENTRY: CalendarEntry = {
  id: 'entry_1',
  userId: 'user_1',
  activityId: 'activity_1',
  scheduledAt: new Date('2026-06-01T19:00:00.000Z'),
  notes: null,
  outcome: 'PENDING',
  satisfaction: null,
  reviewNote: null,
  reviewedAt: null,
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
};

describe('toCalendarEntryDTO', () => {
  it('sets activity to null when no summary is provided', () => {
    const dto = toCalendarEntryDTO(ENTRY);

    expect(dto.activity).toBeNull();
  });

  it('embeds the given activity summary', () => {
    const dto = toCalendarEntryDTO(ENTRY, {
      slug: 'a-slug',
      title: 'A title',
      imageUrl: null,
      kind: 'PLACE',
    });

    expect(dto.activity).toEqual({
      slug: 'a-slug',
      title: 'A title',
      imageUrl: null,
      kind: 'PLACE',
    });
  });

  it('keeps the existing fields unchanged', () => {
    const dto = toCalendarEntryDTO(ENTRY);

    expect(dto.id).toBe('entry_1');
    expect(dto.userId).toBe('user_1');
    expect(dto.activityId).toBe('activity_1');
    expect(dto.scheduledAt).toBe('2026-06-01T19:00:00.000Z');
    expect(dto.outcome).toBe('PENDING');
  });
});
