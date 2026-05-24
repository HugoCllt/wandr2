import { describe, expect, it } from 'vitest';

import { computeDedupeKey } from './computeDedupeKey';

describe('computeDedupeKey', () => {
  it('builds an EVENT key from slug, start day, and rounded coords', () => {
    const key = computeDedupeKey({
      kind: 'EVENT',
      title: 'MURAL Festival',
      dateStart: new Date('2026-06-04T16:00:00.000Z'),
      latitude: 45.5162,
      longitude: -73.5817,
    });
    expect(key).toBe('mural-festival|2026-06-04|45.516,-73.582');
  });

  it('builds a PLACE key from slug and rounded coords only', () => {
    const key = computeDedupeKey({
      kind: 'PLACE',
      title: 'Bota Bota',
      dateStart: null,
      latitude: 45.5014,
      longitude: -73.5496,
    });
    expect(key).toBe('bota-bota|45.501,-73.550');
  });

  it('is stable across coordinate jitter within ~100m (3-decimal rounding)', () => {
    const a = computeDedupeKey({
      kind: 'PLACE',
      title: 'Mount Royal Lookout',
      dateStart: null,
      latitude: 45.5036,
      longitude: -73.5871,
    });
    const b = computeDedupeKey({
      kind: 'PLACE',
      title: 'Mount Royal Lookout',
      dateStart: null,
      latitude: 45.5038,
      longitude: -73.5869,
    });
    expect(a).toBe(b);
  });

  it('throws when an EVENT has no dateStart', () => {
    expect(() =>
      computeDedupeKey({
        kind: 'EVENT',
        title: 'X',
        dateStart: null,
        latitude: 45.5,
        longitude: -73.5,
      }),
    ).toThrow(/dateStart/);
  });
});
