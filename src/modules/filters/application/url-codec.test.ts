import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { ActivityCategories, ActivityKinds } from '../../activities/domain/Activity';
import type { FilterValue } from '../domain/FilterValue';
import { parseFilters, serializeFilters } from './url-codec';

function expectRoundTrip(value: FilterValue): void {
  const params = serializeFilters(value);
  const parsed = parseFilters(params);
  expect(parsed).toEqual(value);
}

describe('serializeFilters / parseFilters — fixtures', () => {
  it('returns an empty filter for empty params', () => {
    expect(parseFilters(new URLSearchParams())).toEqual({});
  });

  it('serializes an empty filter to no params', () => {
    expect(serializeFilters({}).toString()).toBe('');
  });

  it('round-trips kind=EVENT', () => {
    expectRoundTrip({ kind: 'EVENT' });
  });

  it('round-trips a neighborhood multi-select as a CSV', () => {
    const params = serializeFilters({ neighborhood: ['Plateau', 'Mile-End'] });
    expect(params.get('neighborhood')).toBe('Plateau,Mile-End');
    expect(parseFilters(params)).toEqual({ neighborhood: ['Plateau', 'Mile-End'] });
  });

  it('round-trips category as a CSV', () => {
    const params = serializeFilters({ category: ['SPORT', 'FOOD'] });
    expect(params.get('category')).toBe('SPORT,FOOD');
    expect(parseFilters(params)).toEqual({ category: ['SPORT', 'FOOD'] });
  });

  it('round-trips date=weekend', () => {
    expectRoundTrip({ date: 'weekend' });
  });

  it('round-trips date=today', () => {
    expectRoundTrip({ date: 'today' });
  });

  it('round-trips a custom date range as YYYY-MM-DD..YYYY-MM-DD', () => {
    const params = serializeFilters({ date: { from: '2026-06-15', to: '2026-06-20' } });
    expect(params.get('date')).toBe('2026-06-15..2026-06-20');
    expect(parseFilters(params)).toEqual({
      date: { from: '2026-06-15', to: '2026-06-20' },
    });
  });

  it('round-trips priceMax', () => {
    const params = serializeFilters({ priceMax: 15 });
    expect(params.get('priceMax')).toBe('15');
    expect(parseFilters(params)).toEqual({ priceMax: 15 });
  });

  it('round-trips boolean toggles', () => {
    expectRoundTrip({ indoor: true, outdoor: false, free: true, paid: false });
  });

  it('round-trips the PRD example URL', () => {
    const params = new URLSearchParams(
      'kind=EVENT&neighborhood=Plateau,Mile-End&date=weekend&category=SPORT,FOOD&priceMax=15&indoor=true&free=true',
    );
    expect(parseFilters(params)).toEqual({
      kind: 'EVENT',
      neighborhood: ['Plateau', 'Mile-End'],
      date: 'weekend',
      category: ['SPORT', 'FOOD'],
      priceMax: 15,
      indoor: true,
      free: true,
    });
  });

  it('omits undefined keys when serializing', () => {
    const params = serializeFilters({ kind: 'PLACE' });
    expect(params.toString()).toBe('kind=PLACE');
  });

  it('drops unknown keys when parsing', () => {
    const params = new URLSearchParams('kind=EVENT&unknown=foo');
    expect(parseFilters(params)).toEqual({ kind: 'EVENT' });
  });

  it('returns an empty filter when params are invalid', () => {
    const params = new URLSearchParams('kind=NOT_A_KIND');
    expect(parseFilters(params)).toEqual({});
  });
});

describe('serializeFilters / parseFilters — round-trip property', () => {
  const isoDate = fc
    .date({ min: new Date('2020-01-01'), max: new Date('2030-12-31'), noInvalidDate: true })
    .map((d) => d.toISOString().slice(0, 10));

  const dateFilter = fc.oneof(
    fc.constant('today' as const),
    fc.constant('weekend' as const),
    fc.tuple(isoDate, isoDate).map(([a, b]) => (a <= b ? { from: a, to: b } : { from: b, to: a })),
  );

  const filterArb = fc.record(
    {
      kind: fc.constantFrom(...ActivityKinds),
      neighborhood: fc.array(
        fc
          .string({ minLength: 1, maxLength: 16 })
          // Avoid commas (CSV separator) and ASCII control chars in fixtures.
          .filter((s) => !s.includes(',') && /^[\x20-\x7E]+$/.test(s) && s.trim().length > 0),
        { minLength: 1, maxLength: 4 },
      ),
      date: dateFilter,
      category: fc.uniqueArray(fc.constantFrom(...ActivityCategories), {
        minLength: 1,
        maxLength: ActivityCategories.length,
      }),
      priceMax: fc.integer({ min: 0, max: 1000 }),
      indoor: fc.boolean(),
      outdoor: fc.boolean(),
      free: fc.boolean(),
      paid: fc.boolean(),
    },
    { requiredKeys: [] },
  );

  it('any valid FilterValue round-trips through serialize → parse', () => {
    fc.assert(
      fc.property(filterArb, (value) => {
        const params = serializeFilters(value as FilterValue);
        const parsed = parseFilters(params);
        expect(parsed).toEqual(value);
      }),
      { numRuns: 200 },
    );
  });
});
