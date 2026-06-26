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

/**
 * Spotlight — an editorial text/photo split wrapped in a charcoal gradient
 * panel (premium-band aesthetic), with generous padding. The photo's inner
 * bottom-left corner carries an exaggerated squircle crop while the other three
 * corners stay lightly rounded. Text-left / image-right. Clicking opens the
 * activity modal. The section heading ("Coup de cœur") is supplied by the
 * wrapping `feed-section`, so this card carries no eyebrow.
 */
export function SpotlightActivityCard({ activity }: Props): ReactElement {
  const open = useOpenActivity();
  const price = formatActivityPrice(activity);

  return (
    <article className="spotlight" onClick={() => open(activity)}>
      <div className="spotlight-body">
        <div className="spotlight-block spotlight-head">
          <h3 className="spotlight-title">{activity.title}</h3>
          <p className="spotlight-desc">{activity.description}</p>
        </div>
        <div className="spotlight-block spotlight-meta">
          <span>{formatActivityWhen(activity)}</span>
          <span className="dot" />
          <span>{formatActivityWhere(activity)}</span>
        </div>
        {price ? (
          <div className="spotlight-block spotlight-price">
            <b>{price}</b>
          </div>
        ) : null}
        <span className="spotlight-cta">
          Découvrir <Icon name="arrow-right" size={16} />
        </span>
      </div>
      <div className="spotlight-media">
        <div
          className="img"
          style={{ backgroundImage: `url(${coverImageUrl(activity)})` }}
        />
      </div>
    </article>
  );
}
