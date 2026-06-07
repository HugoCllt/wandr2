'use client';

import type { ReactElement, ReactNode } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { coverImageUrl, formatActivityPrice, formatActivityWhen, formatActivityWhere, useOpenActivity } from './helpers';

type Badge = { label: string; kind: 'trending' | 'popular' | 'hot' | 'new' };

type Props = {
  activity: ActivityDTO;
  live?: boolean;
  badge?: Badge;
  showPrice?: boolean;
  favoriteSlot?: ReactNode;
};

function deriveBadge(activity: ActivityDTO): Badge | null {
  if (activity.isFeatured) return { label: 'Tendance', kind: 'trending' };
  return null;
}

/**
 * Tuile — the workhorse full-bleed photo card. Title/meta/price overlaid on a
 * bottom scrim; optional favorite (save) top-right; optional trending badge.
 * No rating dots (no rating field) and no calendar button (decision D4).
 */
export function CoverActivityCard({
  activity,
  live = false,
  badge,
  showPrice = false,
  favoriteSlot,
}: Props): ReactElement {
  const open = useOpenActivity();
  const activeBadge = live ? null : badge ?? deriveBadge(activity);
  const price = formatActivityPrice(activity);

  return (
    <article className="tuile" onClick={() => open(activity)}>
      <div className="tuile-img" style={{ backgroundImage: `url(${coverImageUrl(activity)})` }} />
      <div className="tuile-scrim" />
      {live && (
        <span className="cover-card-live">
          <span className="pulse" /> En direct
        </span>
      )}
      {activeBadge && <span className="tuile-badge">{activeBadge.label}</span>}
      {favoriteSlot}
      <div className="tuile-body">
        <h3 className="tuile-title">{activity.title}</h3>
        <div className="tuile-meta">
          <span>{formatActivityWhen(activity)}</span>
          <span className="dot" />
          <span>{formatActivityWhere(activity)}</span>
        </div>
        <div className="tuile-foot">
          {showPrice && price ? <span className="tuile-price">{price}</span> : null}
        </div>
      </div>
    </article>
  );
}
