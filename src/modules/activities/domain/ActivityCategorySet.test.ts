import { describe, expect, it } from 'vitest';

import {
  type ActivityCategorySet,
  categorySetToArray,
  validateCategorySet,
} from './ActivityCategorySet';

describe('validateCategorySet', () => {
  it('accepts a primary with one secondary', () => {
    expect(() => validateCategorySet({ primary: 'FOOD', secondary: ['ROMANTIC'] })).not.toThrow();
  });

  it('accepts a primary with no secondary', () => {
    expect(() => validateCategorySet({ primary: 'FOOD', secondary: [] })).not.toThrow();
  });

  it('rejects primary appearing in secondary', () => {
    expect(() => validateCategorySet({ primary: 'FOOD', secondary: ['FOOD'] })).toThrow();
  });

  it('rejects more than two secondary categories', () => {
    expect(() =>
      validateCategorySet({ primary: 'FOOD', secondary: ['ROMANTIC', 'CULTURE', 'OUTDOOR'] }),
    ).toThrow();
  });

  it('rejects duplicate secondary categories', () => {
    expect(() =>
      validateCategorySet({ primary: 'FOOD', secondary: ['ROMANTIC', 'ROMANTIC'] }),
    ).toThrow();
  });

  it('rejects an invalid enum value', () => {
    expect(() =>
      validateCategorySet({ primary: 'BOGUS' as ActivityCategorySet['primary'], secondary: [] }),
    ).toThrow();
  });
});

describe('categorySetToArray', () => {
  it('returns primary followed by secondary', () => {
    expect(categorySetToArray({ primary: 'FOOD', secondary: ['ROMANTIC', 'CULTURE'] })).toEqual([
      'FOOD',
      'ROMANTIC',
      'CULTURE',
    ]);
  });
});
