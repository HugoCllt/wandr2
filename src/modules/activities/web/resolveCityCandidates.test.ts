import { describe, expect, it } from 'vitest';

import { resolveCityCandidates } from './resolveCityCandidates';

describe('resolveCityCandidates', () => {
  it('orders header -> cookie -> profile -> montreal', () => {
    expect(
      resolveCityCandidates({ headerSlug: 'paris', cookieSlug: 'lyon', profileSlug: 'nice' }),
    ).toEqual(['paris', 'lyon', 'nice', 'montreal']);
  });

  it('skips a blank header and falls through to the next source', () => {
    expect(
      resolveCityCandidates({ headerSlug: '  ', cookieSlug: 'lyon', profileSlug: 'paris' }),
    ).toEqual(['lyon', 'paris', 'montreal']);
  });

  it('omits missing sources entirely', () => {
    expect(
      resolveCityCandidates({ headerSlug: null, cookieSlug: null, profileSlug: null }),
    ).toEqual(['montreal']);
  });

  it('dedupes repeated slugs, keeping the highest-priority position', () => {
    expect(
      resolveCityCandidates({ headerSlug: 'paris', cookieSlug: 'paris', profileSlug: 'montreal' }),
    ).toEqual(['paris', 'montreal']);
  });

  it('trims whitespace on every source', () => {
    expect(
      resolveCityCandidates({ headerSlug: ' paris ', cookieSlug: null, profileSlug: null }),
    ).toEqual(['paris', 'montreal']);
  });

  it('always ends with montreal even when every source is already montreal', () => {
    expect(
      resolveCityCandidates({ headerSlug: 'montreal', cookieSlug: null, profileSlug: null }),
    ).toEqual(['montreal']);
  });
});
