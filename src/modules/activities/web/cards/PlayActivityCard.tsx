'use client';

import type { ReactElement } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { FlameRow } from '../../../../shared/ui/icons/FlameRow';
import { formatActivityPrice, formatActivityWhere, useOpenActivity } from './helpers';

type Props = {
  activity: ActivityDTO;
  deal?: string;
  flames?: number;
};

export function PlayActivityCard({ activity, deal, flames = 3 }: Props): ReactElement {
  const open = useOpenActivity();
  const titleLines = activity.title.split('\n');

  return (
    <button type="button" className="play-card" onClick={() => open(activity)}>
      <div className="play-img" style={{ backgroundImage: `url(${activity.imageUrl})` }}>
        {deal && <span className="play-deal">{deal}</span>}
      </div>
      <div className="play-body">
        <h4 className="play-title">
          {titleLines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </h4>
        <div className="play-meta">{formatActivityWhere(activity)}</div>
        <div className="play-foot">
          <span className="play-price">{formatActivityPrice(activity)}</span>
          <FlameRow value={flames} size={10} />
        </div>
      </div>
    </button>
  );
}
