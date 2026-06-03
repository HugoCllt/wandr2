'use client';

import type { ReactElement, ReactNode } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { coverImageUrl, formatActivityPrice, formatActivityWhen, formatActivityWhere, useOpenActivity } from './helpers';

type Props = {
  activity: ActivityDTO;
  side?: 'left' | 'right';
  eyebrow?: string;
  favoriteSlot?: ReactNode;
  calendarSlot?: ReactNode;
};

export function MediaRowActivityCard({
  activity,
  side = 'left',
  eyebrow,
  favoriteSlot,
  calendarSlot,
}: Props): ReactElement {
  const open = useOpenActivity();
  const titleLines = activity.title.split('\n');
  const className = 'media-row-card' + (side === 'right' ? ' reverse' : '');

  return (
    <article className={className} onClick={() => open(activity)}>
      <div className="media-row-img" style={{ backgroundImage: `url(${coverImageUrl(activity)})` }} />
      <div className="media-row-body">
        {eyebrow ? <div className="media-row-eyebrow">{eyebrow}</div> : null}
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
            {favoriteSlot}
            {calendarSlot}
          </span>
        </div>
      </div>
    </article>
  );
}
