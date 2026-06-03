'use client';

import type { CSSProperties, ReactElement, ReactNode } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { coverImageUrl, formatActivityPrice, formatActivityWhen, formatActivityWhere, useOpenActivity } from './helpers';

type Badge = { label: string; kind: 'trending' | 'popular' | 'hot' | 'new' };

type Props = {
  activity: ActivityDTO;
  live?: boolean;
  size?: 'lg' | 'sm';
  badge?: Badge;
  showPrice?: boolean;
  favoriteSlot?: ReactNode;
  calendarSlot?: ReactNode;
};

function deriveBadge(activity: ActivityDTO): Badge | null {
  if (activity.isFeatured) return { label: 'Trending', kind: 'trending' };
  return null;
}

/**
 * Full-bleed cover image with the activity info overlaid at the bottom. The
 * canonical activity card — used across the category feed, favorites, the home
 * map panel and the design showcase. Favorite, calendar and price are optional
 * so a bare variant (e.g. the showcase "Tonight" row) can render without them.
 */
export function CoverActivityCard({
  activity,
  live = false,
  size = 'sm',
  badge,
  showPrice = false,
  favoriteSlot,
  calendarSlot,
}: Props): ReactElement {
  const open = useOpenActivity();
  const titleLines = activity.title.split('\n');
  const activeBadge = live ? null : badge ?? deriveBadge(activity);
  const price = formatActivityPrice(activity);
  const showFoot = (showPrice && Boolean(price)) || Boolean(calendarSlot);
  const style: CSSProperties = { minHeight: size === 'lg' ? 320 : 240 };

  return (
    <article className="cover-card" style={style} onClick={() => open(activity)}>
      <div className="cover-card-img" style={{ backgroundImage: `url(${coverImageUrl(activity)})` }} />
      {live && (
        <span className="cover-card-live">
          <span className="pulse" /> Live tonight
        </span>
      )}
      {activeBadge && <span className={'cover-card-badge ' + activeBadge.kind}>{activeBadge.label}</span>}
      {favoriteSlot}
      <div className="cover-card-content">
        <h3 className="cover-card-title">
          {titleLines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </h3>
        <div className="cover-card-meta">
          <span>{formatActivityWhen(activity)}</span>
          <span className="dot" />
          <span>{formatActivityWhere(activity)}</span>
        </div>
        {showFoot && (
          <div className="cover-card-foot">
            {showPrice && price ? <span className="cover-card-price">{price}</span> : null}
            {calendarSlot}
          </div>
        )}
      </div>
    </article>
  );
}
