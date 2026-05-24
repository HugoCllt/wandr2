'use client';

import type { ReactElement } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { AddToCalendarButton } from '../../../calendar/web/AddToCalendarButton';
import { FavoriteButton } from '../../../favorites/web/FavoriteButton';
import { formatActivityPrice, formatActivityWhen, formatActivityWhere, useOpenActivity } from './helpers';

type Props = {
  activity: ActivityDTO;
  side?: 'left' | 'right';
  eyebrow?: string;
  isFavorited?: boolean;
};

export function MediaRowActivityCard({
  activity,
  side = 'left',
  eyebrow,
  isFavorited,
}: Props): ReactElement {
  const open = useOpenActivity();
  const titleLines = activity.title.split('\n');
  const className = 'media-row-card' + (side === 'right' ? ' reverse' : '');

  return (
    <article className={className} onClick={() => open(activity)}>
      <div className="media-row-img" style={{ backgroundImage: `url(${activity.imageUrl})` }} />
      <div className="media-row-body">
        <div className="media-row-eyebrow">{eyebrow ?? 'IN THE SPOTLIGHT'}</div>
        <h3 className="media-row-title">
          {titleLines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </h3>
        <p className="media-row-desc">{activity.description}</p>
        <div className="media-row-meta">
          <span>{formatActivityWhen(activity)}</span>
          <span className="dot" />
          <span>{formatActivityWhere(activity)}</span>
        </div>
        <div className="media-row-foot">
          <span className="media-row-price">{formatActivityPrice(activity)}</span>
          <span className="media-row-actions">
            {isFavorited !== undefined && (
              <FavoriteButton activityId={activity.id} initialFavorited={isFavorited} />
            )}
            <AddToCalendarButton activityId={activity.id} activityTitle={activity.title} />
          </span>
        </div>
      </div>
    </article>
  );
}
