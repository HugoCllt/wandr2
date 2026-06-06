import type { ReactElement, ReactNode } from 'react';

import type { FeedItemDTO } from '../../../shared/contracts/FeedResultDTO';
import { DEFAULT_FEED_SECTIONS } from '../../../shared/presets/FEED_SECTIONS';
import { CoverActivityCard } from '../../activities/web/cards/CoverActivityCard';
import { MediaRowActivityCard } from '../../activities/web/cards/MediaRowActivityCard';
import { AddToCalendarButton } from '../../calendar/web/AddToCalendarButton';
import { FavoriteButton } from '../../favorites/web/FavoriteButton';
import { buildFeedSections, type RenderedSection } from './buildFeedSections';
import { FeedGrid } from './FeedGrid';

/** 1 MediaRow + up to 4 grid cards. */
const STANZA = 5;

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
function calendarSlot(a: FeedItemDTO): ReactNode {
  return <AddToCalendarButton activityId={a.id} activityTitle={a.title} />;
}

function chunk(items: FeedItemDTO[], size: number): FeedItemDTO[][] {
  const out: FeedItemDTO[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function Section({ section }: { section: RenderedSection }): ReactElement {
  const [feature, ...rest] = section.items;
  const stanzas = chunk(rest, STANZA);

  return (
    <section className="content-section">
      <div className="section-head">
        <div>
          <h2>{section.spec.title}</h2>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <CoverActivityCard
          activity={feature}
          size="lg"
          showPrice
          favoriteSlot={favoriteSlot(feature)}
          calendarSlot={calendarSlot(feature)}
        />
        {stanzas.map((stanza, i) => {
          const [row, ...grid] = stanza;
          return (
            <div key={`stanza-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <MediaRowActivityCard
                activity={row}
                side={i % 2 === 0 ? 'left' : 'right'}
                favoriteSlot={favoriteSlot(row)}
                calendarSlot={calendarSlot(row)}
              />
              {grid.length > 0 && (
                <div className="cover-grid">
                  {grid.map((a) => (
                    <CoverActivityCard
                      key={a.id}
                      activity={a}
                      showPrice
                      favoriteSlot={favoriteSlot(a)}
                      calendarSlot={calendarSlot(a)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Renders the partitioned pool as themed sections (feature → alternating
 * MediaRow + grid-of-4) followed by a trailing "Toutes les activités" grid for
 * the long tail. Server component; the cards/slots are client leaves.
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

  return (
    <>
      {sections.map((section) => (
        <Section key={section.spec.key} section={section} />
      ))}
      {showTail && (
        <section className="content-section">
          <div className="section-head">
            <div>
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
