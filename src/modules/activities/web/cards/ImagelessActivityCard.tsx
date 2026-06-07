'use client';

import type { ReactElement, ReactNode } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { Icon } from '../../../../shared/ui/icons/Icon';
import { categoryIconFor, categoryLabelFor } from './categoryMeta';
import { formatActivityPrice, formatActivityWhen, formatActivityWhere, useOpenActivity } from './helpers';

type Props = {
  activity: ActivityDTO;
  favoriteSlot?: ReactNode;
};

/**
 * No-photo card: a deliberate paper brushed-gradient text card with the same
 * footprint as a Tuile. Routed to when `activity.imageUrl` is null. Consumes
 * ActivityDTO → lives in activities/web.
 */
export function ImagelessActivityCard({ activity, favoriteSlot }: Props): ReactElement {
  const open = useOpenActivity();
  const primary = activity.categories.primary;
  const price = formatActivityPrice(activity);

  return (
    <article className="nophoto" onClick={() => open(activity)}>
      <div className="nophoto-top">
        <span className="nophoto-cat">{categoryLabelFor(primary)}</span>
        <span className="nophoto-mark">
          <Icon name={categoryIconFor(primary)} size={20} />
        </span>
      </div>
      <h3 className="nophoto-title">{activity.title}</h3>
      <div className="nophoto-meta">
        <span>{formatActivityWhen(activity)}</span>
        <span className="dot" />
        <span>{formatActivityWhere(activity)}</span>
      </div>
      <div className="nophoto-foot">
        {price ? <span className="nophoto-price">{price}</span> : <span />}
        {favoriteSlot}
      </div>
    </article>
  );
}
