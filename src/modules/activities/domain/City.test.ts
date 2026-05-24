import { describe, expect, it } from 'vitest';

import { isWithinCityBbox, type City } from './City';

const montreal: City = {
  id: 'city_mtl',
  slug: 'montreal',
  name: 'Montréal',
  country: 'CA',
  timezone: 'America/Toronto',
  centerLat: 45.5019,
  centerLng: -73.5674,
  bboxMinLat: 45.4,
  bboxMinLng: -73.98,
  bboxMaxLat: 45.71,
  bboxMaxLng: -73.47,
};

describe('isWithinCityBbox', () => {
  it('accepts a point inside the bbox', () => {
    expect(isWithinCityBbox(montreal, 45.5162, -73.5817)).toBe(true);
  });

  it('rejects a point north of the bbox', () => {
    expect(isWithinCityBbox(montreal, 46.0, -73.5817)).toBe(false);
  });

  it('rejects a point west of the bbox', () => {
    expect(isWithinCityBbox(montreal, 45.5, -74.5)).toBe(false);
  });

  it('accepts the boundary edges (inclusive)', () => {
    expect(isWithinCityBbox(montreal, 45.4, -73.98)).toBe(true);
    expect(isWithinCityBbox(montreal, 45.71, -73.47)).toBe(true);
  });
});
