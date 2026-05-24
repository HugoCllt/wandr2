'use client';

import type { ReactElement } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { Icon } from '../../../../shared/ui/icons/Icon';
import { coverImageUrl, useOpenActivity } from './helpers';

type Props = {
  activity: ActivityDTO;
  eyebrow?: string;
};

export function HeroActivityCard({ activity, eyebrow }: Props): ReactElement {
  const open = useOpenActivity();
  const titleLines = activity.title.split('\n');

  return (
    <article className="hero-card">
      <div className="hero-img" style={{ backgroundImage: `url(${coverImageUrl(activity)})` }} />
      <div className="hero-content">
        <div>
          <div className="hero-eyebrow">{eyebrow ?? 'FEATURED THIS WEEK'}</div>
          <h1 className="hero-title">
            {titleLines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </h1>
          <p className="hero-sub">{activity.description}</p>
        </div>
        <div className="hero-cta-row">
          <button type="button" className="btn-primary" onClick={() => open(activity)}>
            Explore Now
            <Icon name="arrow-right" size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
