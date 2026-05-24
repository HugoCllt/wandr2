'use client';

import type { ReactElement } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { FlameRow } from '../../../../shared/ui/icons/FlameRow';
import { coverImageUrl, useOpenActivity } from './helpers';

type Props = {
  activity: ActivityDTO;
  flames?: number;
};

export function SideActivityCard({ activity, flames = 4 }: Props): ReactElement {
  const open = useOpenActivity();
  const lines = activity.title.split('\n');

  return (
    <button type="button" className="side-card" onClick={() => open(activity)}>
      <div className="side-card-img" style={{ backgroundImage: `url(${coverImageUrl(activity)})` }} />
      <div className="side-card-body">
        <h4>
          {lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </h4>
        <FlameRow value={flames} size={11} dimColor="dim-light" />
      </div>
    </button>
  );
}
