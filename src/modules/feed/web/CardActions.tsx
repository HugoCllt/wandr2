import type { ReactElement } from 'react';

import type { FeedItemDTO } from '../../../shared/contracts/FeedResultDTO';
import { BookmarkButton } from '../../calendar/web/BookmarkButton';
import { FavoriteButton } from '../../favorites/web/FavoriteButton';

/**
 * The stacked favorite + signet controls overlaid on a card's right edge.
 * Hidden at rest and revealed on card hover (CSS `.card-actions`), sliding in
 * from the right — the consumer-injected `actionsSlot` so cards stay DTO-light
 * and `activities/*` never imports its sibling capabilities.
 */
export function CardActions({ item }: { item: FeedItemDTO }): ReactElement {
  return (
    <div className="card-actions">
      <FavoriteButton activityId={item.id} initialFavorited={item.isFavorited} />
      <BookmarkButton
        activityId={item.id}
        activityTitle={item.title}
        dateStart={item.dateStart}
        initialBookmarked={item.isBookmarked}
      />
    </div>
  );
}
