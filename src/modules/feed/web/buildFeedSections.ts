import type { FeedItemDTO } from '../../../shared/contracts/FeedResultDTO';
import type { FeedSectionSource, FeedSectionSpec } from '../../../shared/presets/FEED_SECTIONS';

export type RenderedSection = { spec: FeedSectionSpec; items: FeedItemDTO[] };
export type SectionedResult = { sections: RenderedSection[]; leftovers: FeedItemDTO[] };

/** How many items the page pool is fetched at (cap is MAX_FEED_LIMIT = 50). */
export const POOL_LIMIT = 48;
/** Below this, a themed section auto-hides (feature + 1 full stanza). */
export const MIN_SECTION_ITEMS = 6;
/** feature(1) + 2 stanzas of [MediaRow + 4 grid]. */
export const MAX_SECTION_ITEMS = 11;

const THEMED_PREDICATES: Record<Exclude<FeedSectionSource, 'top'>, (a: FeedItemDTO) => boolean> = {
  outdoor: (a) => a.outdoor,
  free: (a) => a.priceMinCents === 0,
};

/**
 * Partitions a ranked pool into sections by real attributes.
 * - Themed specs (source !== 'top') claim matching, unused items first, in spec
 *   order, capped at MAX; kept only if they reach MIN (else auto-hidden).
 * - `top` claims the best of the remainder (input is matchScore-sorted), capped
 *   at MAX; kept if non-empty. It is assigned last but rendered in spec order.
 * - Exhaustive: every non-excluded item lands in a section or in leftovers.
 */
export function buildFeedSections(
  items: FeedItemDTO[],
  specs: FeedSectionSpec[],
  opts?: { excludeIds?: ReadonlySet<string> },
): SectionedResult {
  const exclude = opts?.excludeIds;
  const pool = exclude ? items.filter((a) => !exclude.has(a.id)) : items;

  const used = new Set<string>();
  const claimed = new Map<string, FeedItemDTO[]>();

  const take = (matches: (a: FeedItemDTO) => boolean): FeedItemDTO[] => {
    const picked: FeedItemDTO[] = [];
    for (const a of pool) {
      if (picked.length >= MAX_SECTION_ITEMS) break;
      if (used.has(a.id)) continue;
      if (matches(a)) picked.push(a);
    }
    return picked;
  };

  // Pass 1 — themed buckets claim first.
  for (const spec of specs) {
    if (spec.source === 'top') continue;
    const picked = take(THEMED_PREDICATES[spec.source]);
    if (picked.length >= MIN_SECTION_ITEMS) {
      picked.forEach((a) => used.add(a.id));
      claimed.set(spec.key, picked);
    }
  }

  // Pass 2 — `top` takes the ranked remainder.
  for (const spec of specs) {
    if (spec.source !== 'top') continue;
    const picked = take(() => true);
    if (picked.length > 0) {
      picked.forEach((a) => used.add(a.id));
      claimed.set(spec.key, picked);
    }
  }

  // Render in spec order (so `top` shows first).
  const sections: RenderedSection[] = [];
  for (const spec of specs) {
    const got = claimed.get(spec.key);
    if (got && got.length > 0) sections.push({ spec, items: got });
  }

  const leftovers = pool.filter((a) => !used.has(a.id));
  return { sections, leftovers };
}
