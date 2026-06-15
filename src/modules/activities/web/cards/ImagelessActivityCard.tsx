'use client';

import type { ReactElement, ReactNode } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { Icon } from '../../../../shared/ui/icons/Icon';
import { categoryIconFor, categoryLabelFor } from './categoryMeta';
import { formatActivityPrice, formatActivityWhen, formatActivityWhere, useOpenActivity } from './helpers';

type Props = {
  activity: ActivityDTO;
  /** Consumer-injected card controls (favorite + signet), overlaid on hover. */
  actionsSlot?: ReactNode;
  /** Hide the price line — e.g. synthetic chat recommendations carry no real price. */
  showPrice?: boolean;
};

/**
 * No-photo card: a deliberate paper brushed-gradient text card with the same
 * footprint as a Tuile. Routed to when `activity.imageUrl` is null. Consumes
 * ActivityDTO → lives in activities/web.
 */
export function ImagelessActivityCard({
  activity,
  actionsSlot,
  showPrice = true,
}: Props): ReactElement {
  const open = useOpenActivity();
  const primary = activity.categories.primary;
  const price = showPrice ? formatActivityPrice(activity) : null;

  return (
    <article className="nophoto" onClick={() => open(activity)}>
      {actionsSlot}
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
      </div>
    </article>
  );
}
