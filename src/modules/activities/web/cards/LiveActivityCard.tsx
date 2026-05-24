'use client';

import type { CSSProperties, ReactElement } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { coverImageUrl, formatActivityWhen, formatActivityWhere, useOpenActivity } from './helpers';

type Props = {
  activity: ActivityDTO;
  live?: boolean;
  size?: 'lg' | 'sm';
};

export function LiveActivityCard({ activity, live = false, size = 'sm' }: Props): ReactElement {
  const open = useOpenActivity();
  const titleLines = activity.title.split('\n');
  const style: CSSProperties = { minHeight: size === 'lg' ? 320 : 240 };

  return (
    <article className="live-card" style={style} onClick={() => open(activity)}>
      <div className="live-img" style={{ backgroundImage: `url(${coverImageUrl(activity)})` }} />
      {live && (
        <span className="live-pill">
          <span className="pulse" /> Live tonight
        </span>
      )}
      <div className="live-content">
        <h4>
          {titleLines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </h4>
        <div className="live-meta">
          <span>{formatActivityWhen(activity)}</span>
          <span className="dot" />
          <span>{formatActivityWhere(activity)}</span>
        </div>
      </div>
    </article>
  );
}
