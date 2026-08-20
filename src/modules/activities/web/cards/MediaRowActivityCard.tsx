'use client';

import type { ReactElement } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { Icon } from '../../../../shared/ui/icons/Icon';
import { useActiveCity } from '../ActiveCityProvider';
import { coverImageUrl, formatActivityPrice, formatActivityWhen, formatActivityWhere, useOpenActivity } from './helpers';

type Props = {
  activity: ActivityDTO;
  /** Alternate the photo to the right (set per section index). */
  flip?: boolean;
  /** Eyebrow above the title. */
  eyebrow?: string;
};

/**
 * Feature — the per-section "À la une" anchor: an editorial photo/text split
 * that alternates sides by section index. Foot = price + "Découvrir →" only
 * (no inline save/calendar, decision D4). Handles a no-image item with a
 * brushed placeholder mark.
 */
export function MediaRowActivityCard({
  activity,
  flip = false,
  eyebrow = 'À la une',
}: Props): ReactElement {
  const open = useOpenActivity();
  const city = useActiveCity();
  const hasImage = Boolean(activity.imageUrl);
  const price = formatActivityPrice(activity);

  return (
    <article className={'feature' + (flip ? ' flip' : '')} onClick={() => open(activity)}>
      <div className={'feature-media' + (hasImage ? '' : ' placeholder')}>
        {hasImage ? (
          <div className="img" style={{ backgroundImage: `url(${coverImageUrl(activity)})` }} />
        ) : (
          <span className="ph-mark">
            <Icon name="compass" size={40} />
          </span>
        )}
      </div>
      <div className="feature-body">
        <div className="feature-eyebrow">{eyebrow}</div>
        <h3 className="feature-title">{activity.title}</h3>
        <p className="feature-desc">{activity.description}</p>
        <div className="feature-meta">
          <span>{formatActivityWhen(activity)}</span>
          <span className="dot" />
          <span>{formatActivityWhere(activity, city.name)}</span>
        </div>
        <div className="feature-foot">
          <span className="feature-price">{price ? <b>{price}</b> : null}</span>
          <span className="feature-cta">
            Découvrir <Icon name="arrow-right" size={16} />
          </span>
        </div>
      </div>
    </article>
  );
}
