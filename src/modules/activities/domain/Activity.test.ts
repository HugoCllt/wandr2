import { describe, expect, it } from 'vitest';

import { createActivity, type ActivityCreateInput } from './Activity';

const eventStart = new Date('2026-06-15T19:00:00.000Z');
const eventEnd = new Date('2026-06-15T21:00:00.000Z');

function baseActivity(overrides: Partial<ActivityCreateInput> = {}): ActivityCreateInput {
  return {
    slug: 'mural-festival',
    title: 'MURAL Festival',
    description: 'Public art and music on Saint-Laurent.',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205',
    kind: 'EVENT',
    categories: { primary: 'CULTURE', secondary: [] },
    address: 'Saint-Laurent Boulevard, Montreal',
    neighborhood: 'Plateau-Mont-Royal',
    latitude: 45.516,
    longitude: -73.583,
    dateStart: eventStart,
    dateEnd: eventEnd,
    priceMinCents: 0,
    priceMaxCents: 2500,
    externalUrl: 'https://example.com/mural',
    indoor: false,
    outdoor: true,
    isFeatured: true,
    status: 'PUBLISHED',
    sourceId: 'source_1',
    cityId: 'city_mtl',
    dedupeKey: 'mural-festival|2026-06-15|45.516,-73.583',
    expiresAt: eventEnd,
    lastSeenAt: eventStart,
    lastVerifiedAt: eventStart,
    recheckAfter: null,
    ...overrides,
  };
}

describe('Activity', () => {
  it('accepts a valid EVENT with dates', () => {
    expect(() => createActivity(baseActivity())).not.toThrow();
  });

  it('requires dates for EVENT activities', () => {
    expect(() => createActivity(baseActivity({ dateStart: null }))).toThrow(/require dateStart/);
    expect(() => createActivity(baseActivity({ dateEnd: null }))).toThrow(/require dateStart/);
  });

  it('rejects EVENT activities ending before they start', () => {
    expect(() =>
      createActivity(baseActivity({ dateEnd: new Date('2026-06-15T18:59:00.000Z') })),
    ).toThrow(/dateEnd/);
  });

  it('rejects dates on PLACE activities', () => {
    expect(() =>
      createActivity(
        baseActivity({
          kind: 'PLACE',
          dateStart: eventStart,
          dateEnd: eventEnd,
          expiresAt: null,
        }),
      ),
    ).toThrow(/PLACE/);
  });

  it('accepts PLACE activities without dates', () => {
    expect(() =>
      createActivity(
        baseActivity({
          slug: 'mount-royal-lookout',
          kind: 'PLACE',
          dateStart: null,
          dateEnd: null,
          expiresAt: null,
        }),
      ),
    ).not.toThrow();
  });

  it('rejects price ranges where max is lower than min', () => {
    expect(() =>
      createActivity(baseActivity({ priceMinCents: 2000, priceMaxCents: 1500 })),
    ).toThrow(/priceMaxCents/);
  });

  it('rejects slugs outside the public URL shape', () => {
    expect(() => createActivity(baseActivity({ slug: 'MURAL Festival!' }))).toThrow(/slug/);
  });

  it('requires a cityId', () => {
    expect(() => createActivity(baseActivity({ cityId: '' }))).toThrow(/cityId/);
  });

  it('requires a dedupeKey', () => {
    expect(() => createActivity(baseActivity({ dedupeKey: '' }))).toThrow(/dedupeKey/);
  });

  it('rejects a PLACE that carries an expiresAt', () => {
    expect(() =>
      createActivity(
        baseActivity({
          slug: 'mount-royal-lookout',
          kind: 'PLACE',
          dateStart: null,
          dateEnd: null,
          expiresAt: eventEnd,
        }),
      ),
    ).toThrow(/expiresAt/);
  });

  it('rejects an EVENT whose expiresAt does not equal dateEnd', () => {
    expect(() =>
      createActivity(baseActivity({ expiresAt: new Date('2026-06-15T22:00:00.000Z') })),
    ).toThrow(/expiresAt/);
  });

  it('rejects an invalid category set (primary in secondary)', () => {
    expect(() =>
      createActivity(baseActivity({ categories: { primary: 'CULTURE', secondary: ['CULTURE'] } })),
    ).toThrow();
  });
});
