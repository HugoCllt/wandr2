'use client';

import type { ReactElement } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { FlameRow } from '../../../../shared/ui/icons/FlameRow';
import { coverImageUrl, formatActivityPrice, formatActivityWhere, useOpenActivity } from './helpers';

type Props = {
  activity: ActivityDTO;
  distanceLabel?: string;
  flames?: number;
};

export function FromMapActivityCard({
  activity,
  distanceLabel,
  flames = 3,
}: Props): ReactElement {
  const open = useOpenActivity();
  const lines = activity.title.split('\n');

  return (
    <button type="button" className="fm-card" onClick={() => open(activity)}>
      <div className="fm-img" style={{ backgroundImage: `url(${coverImageUrl(activity)})` }} />
      <div className="fm-body">
        <div className="fm-title">
          {lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <div className="fm-meta">
          {distanceLabel && (
            <>
              <span>{distanceLabel}</span>
              <span className="dot" />
            </>
          )}
          <span>{formatActivityWhere(activity)}</span>
        </div>
        <div className="fm-foot">
          <span className="fm-price">{formatActivityPrice(activity)}</span>
          <FlameRow value={flames} size={9} />
        </div>
      </div>
    </button>
  );
}
