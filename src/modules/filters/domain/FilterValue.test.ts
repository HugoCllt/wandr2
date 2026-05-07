import { describe, expect, it } from 'vitest';

import { FilterValueSchema } from './FilterValue';

describe('FilterValueSchema', () => {
  it('accepts an empty filter', () => {
    expect(FilterValueSchema.parse({})).toEqual({});
  });

  it('accepts EVENT or PLACE for kind', () => {
    expect(FilterValueSchema.parse({ kind: 'EVENT' })).toEqual({ kind: 'EVENT' });
    expect(FilterValueSchema.parse({ kind: 'PLACE' })).toEqual({ kind: 'PLACE' });
  });

  it('rejects an unknown kind', () => {
    expect(() => FilterValueSchema.parse({ kind: 'OTHER' })).toThrow();
  });

  it('rejects an unknown category', () => {
    expect(() => FilterValueSchema.parse({ category: ['SPORT', 'BAD'] })).toThrow();
  });

  it('accepts the today and weekend date presets', () => {
    expect(FilterValueSchema.parse({ date: 'today' })).toEqual({ date: 'today' });
    expect(FilterValueSchema.parse({ date: 'weekend' })).toEqual({ date: 'weekend' });
  });

  it('accepts a custom date range with ISO YYYY-MM-DD bounds', () => {
    expect(FilterValueSchema.parse({ date: { from: '2026-06-15', to: '2026-06-20' } })).toEqual({
      date: { from: '2026-06-15', to: '2026-06-20' },
    });
  });

  it('rejects a custom date range where to is before from', () => {
    expect(() =>
      FilterValueSchema.parse({ date: { from: '2026-06-20', to: '2026-06-15' } }),
    ).toThrow();
  });

  it('rejects a custom date range with non-ISO bounds', () => {
    expect(() =>
      FilterValueSchema.parse({ date: { from: '06/15/2026', to: '06/20/2026' } }),
    ).toThrow();
  });

  it('rejects a negative priceMax', () => {
    expect(() => FilterValueSchema.parse({ priceMax: -1 })).toThrow();
  });

  it('rejects a non-integer priceMax', () => {
    expect(() => FilterValueSchema.parse({ priceMax: 12.5 })).toThrow();
  });

  it('accepts indoor/outdoor/free/paid booleans', () => {
    expect(
      FilterValueSchema.parse({ indoor: true, outdoor: false, free: true, paid: false }),
    ).toEqual({ indoor: true, outdoor: false, free: true, paid: false });
  });

  it('accepts a neighborhood multi-select array', () => {
    expect(FilterValueSchema.parse({ neighborhood: ['Plateau', 'Mile-End'] })).toEqual({
      neighborhood: ['Plateau', 'Mile-End'],
    });
  });

  it('rejects neighborhood entries that are empty strings', () => {
    expect(() => FilterValueSchema.parse({ neighborhood: ['Plateau', ''] })).toThrow();
  });
});
