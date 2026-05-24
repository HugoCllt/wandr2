'use client';

import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { useOpenActivity } from '../../activities/web/cards/helpers';
import type { CalendarGridCell } from './buildMonthGrid';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export type CalendarGridEvent = {
  id: string;
  scheduledAt: string;
  title: string;
  venue: string;
  time: string;
  isPast: boolean;
  activity: ActivityDTO;
};

type CalendarMonthGridProps = {
  cells: CalendarGridCell[];
  eventsByDate: Record<string, CalendarGridEvent[]>;
  todayKey: string | null;
};

function fmtDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function CalendarMonthGrid({ cells, eventsByDate, todayKey }: CalendarMonthGridProps) {
  const open = useOpenActivity();

  return (
    <div className="cal-grid">
      <div className="cal-grid-head">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="cal-grid-body">
        {cells.map((c, i) => {
          const ds = fmtDate(c.y, c.m, c.d);
          const evs = eventsByDate[ds] ?? [];
          const isToday = todayKey === ds;
          return (
            <div
              key={i}
              className={
                'cal-cell' + (c.outside ? ' outside' : '') + (isToday ? ' today' : '')
              }
            >
              <span className="cal-day">{c.d}</span>
              {evs.slice(0, 3).map((e) => (
                <div
                  key={e.id}
                  className={'cal-event ' + (e.isPast ? 'ink faded' : '')}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    open(e.activity);
                  }}
                  title={`${e.time} — ${e.title}`}
                  role="button"
                  tabIndex={0}
                >
                  <span className="cal-event-dot" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</span>
                </div>
              ))}
              {evs.length > 3 && <span className="cal-more">+{evs.length - 3} more</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
