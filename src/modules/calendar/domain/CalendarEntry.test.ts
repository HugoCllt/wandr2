import { describe, expect, it } from 'vitest';

import { CALENDAR_NOTES_MAX_LENGTH, createCalendarEntry } from './CalendarEntry';

describe('CalendarEntry', () => {
  it('accepts a valid future entry', () => {
    expect(() =>
      createCalendarEntry({
        userId: 'user_1',
        activityId: 'activity_1',
        scheduledAt: new Date('2027-01-01T19:30:00Z'),
        notes: 'Bring scarf',
      }),
    ).not.toThrow();
  });

  it('accepts a past scheduledAt (journal usage)', () => {
    expect(() =>
      createCalendarEntry({
        userId: 'user_1',
        activityId: 'activity_1',
        scheduledAt: new Date('2020-02-15T20:00:00Z'),
      }),
    ).not.toThrow();
  });

  it('accepts null or omitted notes', () => {
    expect(() =>
      createCalendarEntry({
        userId: 'user_1',
        activityId: 'activity_1',
        scheduledAt: new Date('2027-01-01T19:30:00Z'),
        notes: null,
      }),
    ).not.toThrow();
    expect(() =>
      createCalendarEntry({
        userId: 'user_1',
        activityId: 'activity_1',
        scheduledAt: new Date('2027-01-01T19:30:00Z'),
      }),
    ).not.toThrow();
  });

  it('rejects empty userId', () => {
    expect(() =>
      createCalendarEntry({
        userId: '',
        activityId: 'activity_1',
        scheduledAt: new Date('2027-01-01T19:30:00Z'),
      }),
    ).toThrow(/userId/);
  });

  it('rejects whitespace activityId', () => {
    expect(() =>
      createCalendarEntry({
        userId: 'user_1',
        activityId: '   ',
        scheduledAt: new Date('2027-01-01T19:30:00Z'),
      }),
    ).toThrow(/activityId/);
  });

  it('rejects an invalid Date', () => {
    expect(() =>
      createCalendarEntry({
        userId: 'user_1',
        activityId: 'activity_1',
        scheduledAt: new Date('not-a-date'),
      }),
    ).toThrow(/scheduledAt/);
  });

  it('rejects notes longer than the max length', () => {
    expect(() =>
      createCalendarEntry({
        userId: 'user_1',
        activityId: 'activity_1',
        scheduledAt: new Date('2027-01-01T19:30:00Z'),
        notes: 'a'.repeat(CALENDAR_NOTES_MAX_LENGTH + 1),
      }),
    ).toThrow(/200/);
  });
});
