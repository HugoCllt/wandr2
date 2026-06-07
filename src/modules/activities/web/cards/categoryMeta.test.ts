import { describe, expect, it } from 'vitest';

import { categoryIconFor, categoryLabelFor } from './categoryMeta';

describe('categoryMeta', () => {
  it('maps every category to its design icon', () => {
    expect(categoryIconFor('SPORT')).toBe('ball');
    expect(categoryIconFor('ROMANTIC')).toBe('heart');
    expect(categoryIconFor('FOOD')).toBe('fork');
    expect(categoryIconFor('CULTURE')).toBe('culture');
    expect(categoryIconFor('OUTDOOR')).toBe('leaf');
    expect(categoryIconFor('NIGHTLIFE')).toBe('moon');
  });

  it('maps every category to a French label', () => {
    expect(categoryLabelFor('SPORT')).toBe('Sport');
    expect(categoryLabelFor('FOOD')).toBe('Gastronomie');
    expect(categoryLabelFor('NIGHTLIFE')).toBe('Vie nocturne');
  });
});
