import { describe, expect, it } from 'vitest';

import { resolveCitySlug } from './resolveCitySlug';

describe('resolveCitySlug', () => {
  it('prefers the x-wandr-city header over everything', () => {
    expect(resolveCitySlug({ headerSlug: 'paris', cookieSlug: 'montreal', profileSlug: 'lyon' })).toBe('paris');
  });
  it('falls back header -> cookie -> profile -> montreal', () => {
    expect(resolveCitySlug({ headerSlug: null, cookieSlug: 'lyon', profileSlug: 'paris' })).toBe('lyon');
    expect(resolveCitySlug({ headerSlug: null, cookieSlug: null, profileSlug: 'paris' })).toBe('paris');
    expect(resolveCitySlug({ headerSlug: null, cookieSlug: null, profileSlug: null })).toBe('montreal');
  });
  it('ignores blank header values', () => {
    expect(resolveCitySlug({ headerSlug: '  ', cookieSlug: 'lyon', profileSlug: null })).toBe('lyon');
  });
});
