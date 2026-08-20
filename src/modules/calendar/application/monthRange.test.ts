import { describe, expect, it } from 'vitest';

import { formatMonthParam, parseMonthParam, zonedLocalToUtc } from './monthRange';

const MONTREAL_TZ = 'America/Toronto';

describe('parseMonthParam', () => {
  it('parses a valid YYYY-MM and returns inclusive range in UTC', () => {
    const range = parseMonthParam('2026-06', new Date('2026-05-07T10:00:00Z'), MONTREAL_TZ);

    expect(range.year).toBe(2026);
    expect(range.monthIndex).toBe(5); // June = 5
    // June 1 2026 00:00 EDT = 04:00 UTC
    expect(range.fromUtc.toISOString()).toBe('2026-06-01T04:00:00.000Z');
    // Just before July 1 2026 00:00 EDT = 03:59:59.999 UTC
    expect(range.toUtc.toISOString()).toBe('2026-07-01T03:59:59.999Z');
  });

  it('falls back to the current Montreal month for an invalid param', () => {
    const range = parseMonthParam('not-a-month', new Date('2026-05-07T10:00:00Z'), MONTREAL_TZ);

    expect(range.year).toBe(2026);
    expect(range.monthIndex).toBe(4); // May
  });

  it('falls back to the current month when null', () => {
    const range = parseMonthParam(null, new Date('2026-05-07T10:00:00Z'), MONTREAL_TZ);

    expect(range.year).toBe(2026);
    expect(range.monthIndex).toBe(4);
  });

  it('exposes prev/next month wrapping years', () => {
    const jan = parseMonthParam('2026-01', new Date('2026-05-07T10:00:00Z'), MONTREAL_TZ);
    expect(jan.prev).toEqual({ year: 2025, monthIndex: 11 });
    expect(jan.next).toEqual({ year: 2026, monthIndex: 1 });

    const dec = parseMonthParam('2026-12', new Date('2026-05-07T10:00:00Z'), MONTREAL_TZ);
    expect(dec.prev).toEqual({ year: 2026, monthIndex: 10 });
    expect(dec.next).toEqual({ year: 2027, monthIndex: 0 });
  });

  it('handles DST: January 1 has -05:00 offset', () => {
    const utc = zonedLocalToUtc(MONTREAL_TZ, 2026, 0, 1, 0, 0, 0, 0);
    expect(utc.toISOString()).toBe('2026-01-01T05:00:00.000Z');
  });
});

describe('formatMonthParam', () => {
  it('zero-pads the month index', () => {
    expect(formatMonthParam(2026, 0)).toBe('2026-01');
    expect(formatMonthParam(2026, 11)).toBe('2026-12');
  });
});
