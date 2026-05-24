'use client';

import type { ReactElement } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { AddToCalendarButton } from '../../../calendar/web/AddToCalendarButton';
import { FavoriteButton } from '../../../favorites/web/FavoriteButton';
import { Icon } from '../../../../shared/ui/icons/Icon';
import { formatActivityPrice, formatActivityWhen, formatActivityWhere, useOpenActivity } from './helpers';

type Badge = { label: string; kind: 'trending' | 'popular' | 'hot' | 'new' };

type Props = {
  activity: ActivityDTO;
  isFavorited?: boolean;
  badge?: Badge;
};

function deriveBadge(activity: ActivityDTO): Badge | null {
  if (activity.isFeatured) return { label: 'Trending', kind: 'trending' };
  return null;
}

export function RecActivityCard({ activity, isFavorited, badge }: Props): ReactElement {
  const open = useOpenActivity();
  const activeBadge = badge ?? deriveBadge(activity);
  const lines = activity.title.split('\n');

  return (
    <article
      className="rec-card"
      onClick={() => open(activity)}
      style={{ cursor: 'pointer' }}
    >
      <div className="rec-img" style={{ backgroundImage: `url(${activity.imageUrl})` }} />
      {activeBadge && (
        <span className={'rec-badge ' + activeBadge.kind}>{activeBadge.label}</span>
      )}
      {isFavorited !== undefined && (
        <FavoriteButton activityId={activity.id} initialFavorited={isFavorited} />
      )}
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
        <AddToCalendarButton activityId={activity.id} activityTitle={activity.title} />
      </div>
    </article>
  );
}
