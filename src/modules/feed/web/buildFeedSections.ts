import type { FeedItemDTO } from '../../../shared/contracts/FeedResultDTO';
import type { FeedSectionSpec } from '../../../shared/presets/FEED_SECTIONS';

export type RenderedSection = { spec: FeedSectionSpec; items: FeedItemDTO[] };
export type SectionedResult = { sections: RenderedSection[]; leftovers: FeedItemDTO[] };

/** How many items the page pool is fetched at (cap is MAX_FEED_LIMIT = 50). */
export const POOL_LIMIT = 48;
/** "Pour toi" claims the first N ranked items; the rest spill into leftovers. */
export const TOP_LIMIT = 12;

/**
 * Splits a ranked pool into the curated "Pour toi" band (first `TOP_LIMIT`
 * items) and the leftovers (everything else, in rank order). The single `top`
 * spec carries the band title; the leftovers drive the trailing grid. Exhaustive:
 * every item lands in the top band or the leftovers, including the ones the page
 * also highlights in the hero, the map volet or the spotlight — a filtered pool
 * is often small enough that removing them would empty the feed.
 */
export function buildFeedSections(items: FeedItemDTO[], specs: FeedSectionSpec[]): SectionedResult {
  const topSpec = specs.find((s) => s.source === 'top');
  const top = items.slice(0, TOP_LIMIT);
  const leftovers = items.slice(TOP_LIMIT);

  const sections: RenderedSection[] =
    topSpec && top.length > 0 ? [{ spec: topSpec, items: top }] : [];

  return { sections, leftovers };
}
