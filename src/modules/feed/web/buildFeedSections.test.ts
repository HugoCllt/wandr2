import { describe, expect, it } from 'vitest';

import type { FeedItemDTO } from '../../../shared/contracts/FeedResultDTO';
import type { FeedSectionSpec } from '../../../shared/presets/FEED_SECTIONS';
import { buildFeedSections } from './buildFeedSections';

const SPECS: FeedSectionSpec[] = [
  { key: 'top', title: 'Pour toi', source: 'top' },
  { key: 'outdoor', title: 'En plein air', source: 'outdoor' },
  { key: 'free', title: 'Gratuit', source: 'free' },
];

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
    priceMinCents: 1000, // paid by default
    priceMaxCents: null,
    externalUrl: null,
    indoor: true, // indoor + paid => non-themed by default => goes to `top`
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

  it('renders `top` first even though it is assigned last', () => {
    const outdoor = Array.from({ length: 6 }, () => item({ outdoor: true }));
    const rest = Array.from({ length: 6 }, () => item()); // non-themed -> top
    const { sections } = buildFeedSections([...outdoor, ...rest], SPECS);

    expect(sections.map((s) => s.spec.key)).toEqual(['top', 'outdoor']);
    expect(sections[0].items).toHaveLength(6);
    expect(sections[1].items).toHaveLength(6);
  });

  it('auto-hides a themed section below MIN (6) and folds its items into `top`', () => {
    const outdoor = Array.from({ length: 5 }, () => item({ outdoor: true })); // 5 < 6
    const rest = Array.from({ length: 6 }, () => item());
    const { sections, leftovers } = buildFeedSections([...outdoor, ...rest], SPECS);

    expect(sections.map((s) => s.spec.key)).toEqual(['top']);
    expect(sections[0].items).toHaveLength(11); // 5 + 6, capped at MAX
    expect(leftovers).toHaveLength(0);
  });

  it('caps a section at MAX (11) and overflows the rest to leftovers', () => {
    const many = Array.from({ length: 15 }, () => item()); // all non-themed -> top
    const { sections, leftovers } = buildFeedSections(many, SPECS);

    expect(sections.map((s) => s.spec.key)).toEqual(['top']);
    expect(sections[0].items).toHaveLength(11);
    expect(leftovers).toHaveLength(4);
  });

  it('preserves input order within `top` (pool is pre-ranked by matchScore)', () => {
    const a = item({ matchScore: 9 });
    const b = item({ matchScore: 8 });
    const c = item({ matchScore: 7 });
    const { sections } = buildFeedSections([a, b, c], SPECS);

    expect(sections).toHaveLength(1);
    expect(ids(sections[0].items)).toEqual([a.id, b.id, c.id]);
  });

  it('gives a dual-attribute item to the earlier themed pass (outdoor before free)', () => {
    const outdoorOnly = Array.from({ length: 6 }, () => item({ outdoor: true }));
    const dual = item({ outdoor: true, priceMinCents: 0 }); // outdoor AND free
    const freeOnly = Array.from({ length: 6 }, () => item({ priceMinCents: 0 }));
    const { sections } = buildFeedSections([...outdoorOnly, dual, ...freeOnly], SPECS);

    const outdoor = sections.find((s) => s.spec.key === 'outdoor');
    const free = sections.find((s) => s.spec.key === 'free');
    expect(outdoor && ids(outdoor.items)).toContain(dual.id);
    expect(free && ids(free.items)).not.toContain(dual.id);
  });

  it('never places an item in two sections (disjoint)', () => {
    const outdoor = Array.from({ length: 6 }, () => item({ outdoor: true }));
    const free = Array.from({ length: 6 }, () => item({ priceMinCents: 0 }));
    const rest = Array.from({ length: 6 }, () => item());
    const { sections, leftovers } = buildFeedSections([...outdoor, ...free, ...rest], SPECS);

    const all = [...sections.flatMap((s) => s.items), ...leftovers].map((a) => a.id);
    expect(new Set(all).size).toBe(all.length);
  });

  it('is exhaustive: section items + leftovers === input', () => {
    const items = [
      ...Array.from({ length: 6 }, () => item({ outdoor: true })),
      ...Array.from({ length: 4 }, () => item({ priceMinCents: 0 })),
      ...Array.from({ length: 9 }, () => item()),
    ];
    const { sections, leftovers } = buildFeedSections(items, SPECS);
    const total = sections.reduce((n, s) => n + s.items.length, 0) + leftovers.length;
    expect(total).toBe(items.length);
  });

  it('removes excludeIds from both sections and leftovers', () => {
    const keep = Array.from({ length: 6 }, () => item());
    const dropped = item();
    const excludeIds = new Set([dropped.id]);
    const { sections, leftovers } = buildFeedSections([dropped, ...keep], SPECS, { excludeIds });

    const all = [...sections.flatMap((s) => s.items), ...leftovers].map((a) => a.id);
    expect(all).not.toContain(dropped.id);
    expect(all).toHaveLength(keep.length);
  });
});
