import type { ReactElement, ReactNode } from 'react';

import type { FeedItemDTO } from '../../../shared/contracts/FeedResultDTO';
import { DEFAULT_FEED_SECTIONS } from '../../../shared/presets/FEED_SECTIONS';
import { buildFeedSections } from './buildFeedSections';
import { FeedGrid } from './FeedGrid';

type SectionedFeedProps = {
  items: FeedItemDTO[];
  nextCursor: string | null;
  filterQueryString: string;
  feedApiPath?: string;
  /** Optional band rendered between the curated "Pour toi" grid and the long tail. */
  interludeSlot?: ReactNode;
};

/**
 * Renders the partitioned pool as the curated "Pour toi" band (a static parallax
 * masonry of the top picks) followed by a trailing "D'autres ont aussi aimé"
 * grid (the long tail, with infinite scroll). An optional `interludeSlot` sits
 * between the two. Server component; the grids are client leaves.
 */
export function SectionedFeed({
  items,
  nextCursor,
  filterQueryString,
  feedApiPath,
  interludeSlot,
}: SectionedFeedProps): ReactElement {
  const { sections, leftovers } = buildFeedSections(items, DEFAULT_FEED_SECTIONS);
  const showTail = leftovers.length > 0 || nextCursor !== null;

  // No section, no tail, no more pages: the active filters matched nothing.
  // Render an explicit empty state so the feed keeps its height instead of
  // collapsing — otherwise the Premium band would jump up and break the layout.
  if (sections.length === 0 && !showTail) {
    return (
      <section className="feed-section feed-empty">
        <div className="feed-empty-card">
          <h2>Aucune activité</h2>
          <p>
            Aucune activité ne correspond à vos filtres pour le moment. Essayez d&apos;élargir vos
            critères.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      {sections.map((section) => (
        <section className="feed-section" key={section.spec.key}>
          <div className="feed-head">
            <h2>{section.spec.title}</h2>
          </div>
          <FeedGrid
            initialItems={section.items}
            initialCursor={null}
            filterQueryString={filterQueryString}
            feedApiPath={feedApiPath}
            paginate={false}
          />
        </section>
      ))}
      {interludeSlot}
      {showTail && (
        <section className="feed-section">
          <div className="feed-head">
            <h2>D’autres ont aussi aimé</h2>
          </div>
          <FeedGrid
            initialItems={leftovers}
            initialCursor={nextCursor}
            filterQueryString={filterQueryString}
            feedApiPath={feedApiPath}
          />
        </section>
      )}
    </>
  );
}
