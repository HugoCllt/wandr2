import { describe, expect, it } from 'vitest';

import { isWithinCityBbox, validateCity, type City, type CityCreateInput } from './City';

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

describe('validateCity', () => {
  const { id: _id, ...base } = montreal;
  const input = (overrides: Partial<CityCreateInput> = {}): CityCreateInput => ({
    ...base,
    ...overrides,
  });

  it('accepts a well-formed city', () => {
    expect(() => validateCity(input())).not.toThrow();
  });

  it('rejects a slug that is not kebab-case', () => {
    expect(() => validateCity(input({ slug: 'New York' }))).toThrow(/slug/);
  });

  it('rejects a bbox minimum above its maximum', () => {
    expect(() => validateCity(input({ bboxMinLng: -73.0 }))).toThrow(/minimum/);
  });

  it('rejects a center outside its own bbox', () => {
    expect(() => validateCity(input({ centerLat: 48 }))).toThrow(/center/);
  });

  it('rejects non-finite coordinates', () => {
    expect(() => validateCity(input({ centerLat: Number.NaN }))).toThrow(/finite/);
  });
});
