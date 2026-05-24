'use client';

import type { ReactElement } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { FlameRow } from '../../../../shared/ui/icons/FlameRow';
import { Icon } from '../../../../shared/ui/icons/Icon';
import { coverImageUrl, formatActivityWhen, formatActivityWhere, useOpenActivity } from './helpers';

type Props = {
  activity: ActivityDTO;
  tag?: string;
  tagKind?: 'deal' | '';
  flames?: number;
};

export function ClassActivityCard({
  activity,
  tag,
  tagKind = '',
  flames = 3,
}: Props): ReactElement {
  const open = useOpenActivity();
  const titleLines = activity.title.split('\n');

  return (
    <button type="button" className="class-card" onClick={() => open(activity)}>
      <div className="class-img" style={{ backgroundImage: `url(${coverImageUrl(activity)})` }} />
      <div className="class-body">
        <h4 className="class-title">
          {titleLines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </h4>
        <div className="class-row">
          <span className="who">{formatActivityWhere(activity)}</span>
        </div>
        <div className="class-row">
          <Icon name="calendar" size={12} /> {formatActivityWhen(activity)}
        </div>
        <div className="class-foot">
          {tag && <span className={'class-tag ' + tagKind}>{tag}</span>}
          <FlameRow value={flames} size={10} />
        </div>
      </div>
    </button>
  );
}
