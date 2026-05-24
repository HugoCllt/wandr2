import { describe, expect, it } from 'vitest';

import { slugify } from './slug';

describe('slugify', () => {
  it('lowercases, strips accents, and hyphenates', () => {
    expect(slugify('Café de Montréal')).toBe('cafe-de-montreal');
  });

  it('collapses repeated separators and trims edges', () => {
    expect(slugify('  Bota   Bota!! ')).toBe('bota-bota');
  });

  it('falls back to "activity" when nothing usable remains', () => {
    expect(slugify('!!!')).toBe('activity');
  });
});
