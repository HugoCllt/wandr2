'use client';

import type { ReactElement } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { Icon } from '../../../../shared/ui/icons/Icon';
import {
  coverImageUrl,
  formatActivityPrice,
  formatActivityWhen,
  formatActivityWhere,
  useOpenActivity,
} from './helpers';

type Props = {
  activity: ActivityDTO;
};

export function SpotlightActivityCard({ activity }: Props): ReactElement {
  const open = useOpenActivity();
  const price = formatActivityPrice(activity);

  return (
    <article className="spotlight" onClick={() => open(activity)}>
      <div className="spotlight-media">
        <div className="img" style={{ backgroundImage: `url(${coverImageUrl(activity)})` }} />
      </div>
      <div className="spotlight-scrim" />
      <div className="spotlight-body">
        <span className="spotlight-eyebrow">
          <Icon name="heart-fill" size={14} />
          Coup de cœur
        </span>
        <h3 className="spotlight-title">{activity.title}</h3>
        {activity.description ? (
          <p className="spotlight-desc">{activity.description}</p>
        ) : null}
        <div className="spotlight-meta">
          <span>{formatActivityWhen(activity)}</span>
          <span className="dot" />
          <span>{formatActivityWhere(activity)}</span>
          {price ? (
            <>
              <span className="dot" />
              <span>{price}</span>
            </>
          ) : null}
        </div>
        <span className="spotlight-cta">
          Découvrir <Icon name="arrow-right" size={16} />
        </span>
      </div>
    </article>
  );
}
