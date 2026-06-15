import type { ReactElement, ReactNode } from 'react';

import type { FeedItemDTO } from '../../../shared/contracts/FeedResultDTO';
import { DEFAULT_FEED_SECTIONS } from '../../../shared/presets/FEED_SECTIONS';
import { CoverActivityCard } from '../../activities/web/cards/CoverActivityCard';
import { ImagelessActivityCard } from '../../activities/web/cards/ImagelessActivityCard';
import { MediaRowActivityCard } from '../../activities/web/cards/MediaRowActivityCard';
import { FavoriteButton } from '../../favorites/web/FavoriteButton';
import { buildFeedSections, type RenderedSection } from './buildFeedSections';
import { FeedGrid } from './FeedGrid';

type SectionedFeedProps = {
  items: FeedItemDTO[];
  nextCursor: string | null;
  filterQueryString: string;
  feedApiPath?: string;
  /** Activity ids already shown elsewhere on the page (e.g. the Home hero). */
  excludeIds?: ReadonlySet<string>;
};

function favoriteSlot(a: FeedItemDTO): ReactNode {
  return <FavoriteButton activityId={a.id} initialFavorited={a.isFavorited} />;
}

/** Routes a grid item to the Tuile (has photo) or the Imageless card. */
function GridCard({ item }: { item: FeedItemDTO }): ReactElement {
  return item.imageUrl ? (
    <CoverActivityCard activity={item} showPrice favoriteSlot={favoriteSlot(item)} />
  ) : (
    <ImagelessActivityCard activity={item} favoriteSlot={favoriteSlot(item)} />
  );
}

function Section({ section, index }: { section: RenderedSection; index: number }): ReactElement {
  const [feature, ...rest] = section.items;

  return (
    <section className="feed-section">
      <div className="feed-head">
        <div>
          {section.spec.eyebrow ? <div className="feed-eyebrow">{section.spec.eyebrow}</div> : null}
          <h2>{section.spec.title}</h2>
        </div>
      </div>
      <div className="feed-stack">
        <MediaRowActivityCard activity={feature} flip={index % 2 === 1} />
        {rest.length > 0 && (
          <div className="feed-grid">
            {rest.map((a) => (
              <GridCard key={a.id} item={a} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Renders the partitioned pool as themed sections (a Feature anchor + a routed
 * 3-col grid) followed by a trailing "Toutes les activités" grid for the long
 * tail. Server component; cards/slots are client leaves.
 */
export function SectionedFeed({
  items,
  nextCursor,
  filterQueryString,
  feedApiPath,
  excludeIds,
}: SectionedFeedProps): ReactElement {
  const { sections, leftovers } = buildFeedSections(items, DEFAULT_FEED_SECTIONS, { excludeIds });
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
      {sections.map((section, i) => (
        <Section key={section.spec.key} section={section} index={i} />
      ))}
      {showTail && (
        <section className="feed-section">
          <div className="feed-head">
            <div>
              <div className="feed-eyebrow">Tout explorer</div>
              <h2>Toutes les activités</h2>
            </div>
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
