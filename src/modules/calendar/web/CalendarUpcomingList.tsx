'use client';

import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { useOpenActivity } from '../../activities/web/cards/helpers';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

type Item = {
  id: string;
  scheduledAt: string;
  title: string;
  venue: string;
  time: string;
  activity: ActivityDTO;
};

export function CalendarUpcomingList({ items }: { items: Item[] }) {
  const open = useOpenActivity();

  return (
    <div className="cal-upcoming">
      {items.map((e) => {
        const dt = new Date(e.scheduledAt);
        const mo = MONTHS[dt.getMonth()];
        const d = dt.getDate();
        return (
          <button key={e.id} type="button" className="cal-up-row" onClick={() => open(e.activity)}>
            <div className="cal-up-date">
              <div className="mo">{mo}</div>
              <div className="d">{d}</div>
            </div>
            <div>
              <div className="cal-up-title">{e.title}</div>
              <div className="cal-up-meta">
                <span>{e.time}</span>
                <span className="dot" />
                <span>{e.venue}</span>
              </div>
            </div>
          </button>
        );
      })}
      {items.length === 0 && (
        <p style={{ margin: 0, color: 'var(--smoke)', fontSize: 13 }}>
          Nothing booked yet — explore activities and add them to your calendar.
        </p>
      )}
    </div>
  );
}
