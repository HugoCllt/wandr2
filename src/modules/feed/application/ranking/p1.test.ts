import { describe, expect, it } from 'vitest';

import type { Activity, ActivityCategory } from '../../../activities/domain/Activity';
import { rank } from './p1';

const NOW = new Date('2026-05-06T12:00:00.000Z');

function activity(overrides: Partial<Activity>): Activity {
  const createdAt = new Date('2026-04-01T00:00:00.000Z');
  return {
    id: 'activity_default',
    slug: 'default-activity',
    title: 'Default',
    description: 'Default',
    imageUrl: 'https://images.unsplash.com/default',
    kind: 'PLACE',
    categories: { primary: 'CULTURE', secondary: [] },
    address: 'Montreal',
    neighborhood: 'Plateau',
    latitude: 45.5,
    longitude: -73.5,
    dateStart: null,
    dateEnd: null,
    priceMinCents: 0,
    priceMaxCents: null,
    externalUrl: null,
    indoor: false,
    outdoor: false,
    isFeatured: false,
    status: 'PUBLISHED',
    sourceId: 'source_1',
    cityId: 'city_mtl',
    dedupeKey: 'default-activity|45.500,-73.500',
    expiresAt: null,
    lastSeenAt: createdAt,
    lastVerifiedAt: null,
    recheckAfter: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

const EMPTY_AFFINITY: Map<ActivityCategory, number> = new Map();

describe('rank()', () => {
  it('returns activities with matchScore from affinity map', () => {
    const a = activity({ id: 'a', slug: 'a', categories: { primary: 'SPORT', secondary: [] } });
    const b = activity({ id: 'b', slug: 'b', categories: { primary: 'FOOD', secondary: [] } });
    const aff = new Map<ActivityCategory, number>([
      ['SPORT', 8],
      ['FOOD', 9],
    ]);

    const ranked = rank([a, b], aff, NOW);
    const byId = new Map(ranked.map((r) => [r.id, r.matchScore]));

    expect(byId.get('a')).toBe(8);
    expect(byId.get('b')).toBe(9);
  });

  it('falls back to 5 when category has no affinity row', () => {
    const a = activity({ id: 'a', slug: 'a', categories: { primary: 'NIGHTLIFE', secondary: [] } });

    const ranked = rank([a], EMPTY_AFFINITY, NOW);

    expect(ranked[0].matchScore).toBe(5);
  });

  it('places featured activities ahead of non-featured even with lower matchScore', () => {
    const featuredLow = activity({
      id: 'feat',
      slug: 'feat',
      categories: { primary: 'NIGHTLIFE', secondary: [] },
      isFeatured: true,
    });
    const unfeaturedHigh = activity({
      id: 'unf',
      slug: 'unf',
      categories: { primary: 'SPORT', secondary: [] },
      isFeatured: false,
    });
    const aff = new Map<ActivityCategory, number>([
      ['SPORT', 10],
      ['NIGHTLIFE', 0],
    ]);

    const ranked = rank([unfeaturedHigh, featuredLow], aff, NOW);

    expect(ranked.map((r) => r.id)).toEqual(['feat', 'unf']);
  });

  it('breaks featured ties by matchScore descending', () => {
    const a = activity({ id: 'a', slug: 'a', categories: { primary: 'FOOD', secondary: [] }, isFeatured: true });
    const b = activity({ id: 'b', slug: 'b', categories: { primary: 'SPORT', secondary: [] }, isFeatured: true });
    const aff = new Map<ActivityCategory, number>([
      ['SPORT', 9],
      ['FOOD', 3],
    ]);

    const ranked = rank([a, b], aff, NOW);

    expect(ranked.map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('breaks matchScore ties by dateStart ascending (NULLS LAST)', () => {
    const earlyEvent = activity({
      id: 'early',
      slug: 'early',
      kind: 'EVENT',
      categories: { primary: 'CULTURE', secondary: [] },
      dateStart: new Date('2026-06-01T00:00:00.000Z'),
      dateEnd: new Date('2026-06-01T03:00:00.000Z'),
    });
    const lateEvent = activity({
      id: 'late',
      slug: 'late',
      kind: 'EVENT',
      categories: { primary: 'CULTURE', secondary: [] },
      dateStart: new Date('2026-07-01T00:00:00.000Z'),
      dateEnd: new Date('2026-07-01T03:00:00.000Z'),
    });
    const place = activity({
      id: 'place',
      slug: 'place',
      kind: 'PLACE',
      categories: { primary: 'CULTURE', secondary: [] },
    });

    const ranked = rank([place, lateEvent, earlyEvent], EMPTY_AFFINITY, NOW);

    expect(ranked.map((r) => r.id)).toEqual(['early', 'late', 'place']);
  });

  it('breaks dateStart ties by createdAt descending', () => {
    const dateStart = new Date('2026-06-01T00:00:00.000Z');
    const dateEnd = new Date('2026-06-01T03:00:00.000Z');
    const older = activity({
      id: 'older',
      slug: 'older',
      kind: 'EVENT',
      dateStart,
      dateEnd,
      createdAt: new Date('2026-04-01T00:00:00.000Z'),
      updatedAt: new Date('2026-04-01T00:00:00.000Z'),
    });
    const newer = activity({
      id: 'newer',
      slug: 'newer',
      kind: 'EVENT',
      dateStart,
      dateEnd,
      createdAt: new Date('2026-04-15T00:00:00.000Z'),
      updatedAt: new Date('2026-04-15T00:00:00.000Z'),
    });

    const ranked = rank([older, newer], EMPTY_AFFINITY, NOW);

    expect(ranked.map((r) => r.id)).toEqual(['newer', 'older']);
  });

  it('breaks createdAt ties by id ascending (cursor stability)', () => {
    const createdAt = new Date('2026-04-01T00:00:00.000Z');
    const a = activity({
      id: 'a',
      slug: 'a',
      createdAt,
      updatedAt: createdAt,
    });
    const b = activity({
      id: 'b',
      slug: 'b',
      createdAt,
      updatedAt: createdAt,
    });

    const rankedAB = rank([a, b], EMPTY_AFFINITY, NOW);
    const rankedBA = rank([b, a], EMPTY_AFFINITY, NOW);

    expect(rankedAB.map((r) => r.id)).toEqual(['a', 'b']);
    expect(rankedBA.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('high-affinity future EVENT outranks low-affinity imminent EVENT', () => {
    const lowImminent = activity({
      id: 'low',
      slug: 'low',
      kind: 'EVENT',
      categories: { primary: 'NIGHTLIFE', secondary: [] },
      dateStart: new Date('2026-05-08T00:00:00.000Z'),
      dateEnd: new Date('2026-05-08T03:00:00.000Z'),
    });
    const highFuture = activity({
      id: 'high',
      slug: 'high',
      kind: 'EVENT',
      categories: { primary: 'SPORT', secondary: [] },
      dateStart: new Date('2026-08-01T00:00:00.000Z'),
      dateEnd: new Date('2026-08-01T03:00:00.000Z'),
    });
    const aff = new Map<ActivityCategory, number>([
      ['SPORT', 10],
      ['NIGHTLIFE', 1],
    ]);

    const ranked = rank([lowImminent, highFuture], aff, NOW);

    expect(ranked.map((r) => r.id)).toEqual(['high', 'low']);
  });

  it('computes a weighted average of affinity over the category set', () => {
    const a = activity({
      id: 'a',
      slug: 'a',
      categories: { primary: 'ROMANTIC', secondary: ['FOOD'] },
    });
    const aff = new Map<ActivityCategory, number>([
      ['ROMANTIC', 3],
      ['FOOD', 9],
    ]);

    const ranked = rank([a], aff, NOW);

    // (3 + 0.5*9) / (1 + 0.5) = 7.5 / 1.5 = 5.0
    expect(ranked[0].matchScore).toBe(5);
  });

  it('scores a primary-only set as the primary affinity', () => {
    const a = activity({ id: 'a', slug: 'a', categories: { primary: 'FOOD', secondary: [] } });
    const aff = new Map<ActivityCategory, number>([['FOOD', 9]]);

    const ranked = rank([a], aff, NOW);

    expect(ranked[0].matchScore).toBe(9);
  });

  it('is neutral for an anonymous user regardless of set size', () => {
    const single = activity({ id: 'single', slug: 'single', categories: { primary: 'FOOD', secondary: [] } });
    const multi = activity({
      id: 'multi',
      slug: 'multi',
      categories: { primary: 'FOOD', secondary: ['ROMANTIC', 'CULTURE'] },
    });

    const ranked = rank([single, multi], EMPTY_AFFINITY, NOW);
    const byId = new Map(ranked.map((r) => [r.id, r.matchScore]));

    expect(byId.get('single')).toBe(5);
    expect(byId.get('multi')).toBe(5);
  });

  it('returns an empty list for an empty input', () => {
    expect(rank([], EMPTY_AFFINITY, NOW)).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const a = activity({ id: 'a', slug: 'a', isFeatured: false });
    const b = activity({ id: 'b', slug: 'b', isFeatured: true });
    const input = [a, b];
    const original = [...input];

    rank(input, EMPTY_AFFINITY, NOW);

    expect(input).toEqual(original);
  });
});
