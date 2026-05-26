'use client';

import type { ReactElement, ReactNode } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { Icon } from '../../../../shared/ui/icons/Icon';
import { coverImageUrl, formatActivityPrice, formatActivityWhen, formatActivityWhere, useOpenActivity } from './helpers';

type Badge = { label: string; kind: 'trending' | 'popular' | 'hot' | 'new' };

type Props = {
  activity: ActivityDTO;
  badge?: Badge;
  favoriteSlot?: ReactNode;
  calendarSlot?: ReactNode;
};

function deriveBadge(activity: ActivityDTO): Badge | null {
  if (activity.isFeatured) return { label: 'Trending', kind: 'trending' };
  return null;
}

export function RecActivityCard({ activity, badge, favoriteSlot, calendarSlot }: Props): ReactElement {
  const open = useOpenActivity();
  const activeBadge = badge ?? deriveBadge(activity);
  const lines = activity.title.split('\n');

  return (
    <article
      className="rec-card"
      onClick={() => open(activity)}
      style={{ cursor: 'pointer' }}
    >
      <div className="rec-img" style={{ backgroundImage: `url(${coverImageUrl(activity)})` }} />
      {activeBadge && (
        <span className={'rec-badge ' + activeBadge.kind}>{activeBadge.label}</span>
      )}
      {favoriteSlot}
      <div className="rec-content">
        <h3 className="rec-title">
          {lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </h3>
        <div className="rec-meta-row">
          <div className="rec-meta">
            <div>{formatActivityWhen(activity)}</div>
            <div className="dim">{formatActivityWhere(activity)}</div>
          </div>
          <div className="rec-price">{formatActivityPrice(activity)}</div>
        </div>
      </div>
      <div className="rec-foot">
        <span className="rec-foot-left">
          <Icon name="pin" size={13} />
          View on Map
        </span>
        {calendarSlot}
      </div>
    </article>
  );
}
