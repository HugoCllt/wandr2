import { describe, expect, it } from 'vitest';

import type { FeedItemDTO } from '../../../shared/contracts/FeedResultDTO';
import type { FeedSectionSpec } from '../../../shared/presets/FEED_SECTIONS';
import { buildFeedSections, TOP_LIMIT } from './buildFeedSections';

const SPECS: FeedSectionSpec[] = [{ key: 'top', title: 'Pour toi', source: 'top' }];

let seq = 0;
function item(overrides: Partial<FeedItemDTO> = {}): FeedItemDTO {
  seq += 1;
  return {
    id: `a_${seq}`,
    slug: `a-${seq}`,
    title: `Activity ${seq}`,
    description: 'desc',
    imageUrl: null,
    kind: 'PLACE',
    categories: { primary: 'CULTURE', secondary: [] },
    address: 'Montreal',
    neighborhood: null,
    latitude: 45.5,
    longitude: -73.5,
    dateStart: null,
    dateEnd: null,
    priceMinCents: 1000,
    priceMaxCents: null,
    externalUrl: null,
    indoor: true,
    outdoor: false,
    isFeatured: false,
    status: 'PUBLISHED',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    matchScore: 5,
    isFavorited: false,
    isBookmarked: false,
    ...overrides,
  };
}

const ids = (items: FeedItemDTO[]) => items.map((a) => a.id);

describe('buildFeedSections', () => {
  it('returns empty result for empty input', () => {
    expect(buildFeedSections([], SPECS)).toEqual({ sections: [], leftovers: [] });
  });

  it('puts the whole (small) pool in the `top` band with no leftovers', () => {
    const items = Array.from({ length: 6 }, () => item());
    const { sections, leftovers } = buildFeedSections(items, SPECS);

    expect(sections.map((s) => s.spec.key)).toEqual(['top']);
    expect(sections[0].items).toHaveLength(6);
    expect(leftovers).toHaveLength(0);
  });

  it('caps the `top` band at TOP_LIMIT and overflows the rest to leftovers', () => {
    const many = Array.from({ length: TOP_LIMIT + 4 }, () => item());
    const { sections, leftovers } = buildFeedSections(many, SPECS);

    expect(sections.map((s) => s.spec.key)).toEqual(['top']);
    expect(sections[0].items).toHaveLength(TOP_LIMIT);
    expect(leftovers).toHaveLength(4);
  });

  it('preserves input order (pool is pre-ranked by matchScore)', () => {
    const a = item({ matchScore: 9 });
    const b = item({ matchScore: 8 });
    const c = item({ matchScore: 7 });
    const { sections } = buildFeedSections([a, b, c], SPECS);

    expect(sections).toHaveLength(1);
    expect(ids(sections[0].items)).toEqual([a.id, b.id, c.id]);
  });

  it('is exhaustive: section items + leftovers === input', () => {
    const items = Array.from({ length: TOP_LIMIT + 7 }, () => item());
    const { sections, leftovers } = buildFeedSections(items, SPECS);
    const total = sections.reduce((n, s) => n + s.items.length, 0) + leftovers.length;
    expect(total).toBe(items.length);
  });

  it('keeps every pool item, including those already shown in the hero or on the map', () => {
    const items = Array.from({ length: 3 }, () => item());
    const { sections, leftovers } = buildFeedSections(items, SPECS);

    const all = [...sections.flatMap((s) => s.items), ...leftovers].map((a) => a.id);
    expect(all).toEqual(ids(items));
  });
});
