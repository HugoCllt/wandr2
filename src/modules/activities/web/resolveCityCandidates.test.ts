import { describe, expect, it } from 'vitest';

import { resolveCityCandidates, resolveEagerCityCandidates } from './resolveCityCandidates';

describe('resolveEagerCityCandidates', () => {
  it('orders header -> cookie and never appends the fallback', () => {
    expect(resolveEagerCityCandidates({ headerSlug: 'paris', cookieSlug: 'lyon' })).toEqual([
      'paris',
      'lyon',
    ]);
  });

  it('keeps a montreal cookie as its own candidate', () => {
    expect(resolveEagerCityCandidates({ headerSlug: null, cookieSlug: 'montreal' })).toEqual([
      'montreal',
    ]);
  });

  it('is empty when neither header nor cookie carries a slug', () => {
    expect(resolveEagerCityCandidates({ headerSlug: '  ', cookieSlug: null })).toEqual([]);
  });

  it('is always a prefix of the full cascade', () => {
    const eager = resolveEagerCityCandidates({ headerSlug: ' paris ', cookieSlug: 'paris' });
    const full = resolveCityCandidates({
      headerSlug: ' paris ',
      cookieSlug: 'paris',
      profileSlug: 'nice',
    });
    expect(full.slice(0, eager.length)).toEqual(eager);
  });
});

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
