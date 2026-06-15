import Link from 'next/link';
import type { ReactElement } from 'react';

import { buildMonthGrid } from '../../../modules/calendar/web/buildMonthGrid';
import {
  CalendarMonthGrid,
  type CalendarGridEvent,
} from '../../../modules/calendar/web/CalendarMonthGrid';
import { CalendarUpcomingList } from '../../../modules/calendar/web/CalendarUpcomingList';
import { loadCalendarMonth } from '../../../modules/calendar/web/loadCalendarMonth';
import { loadPendingReviews } from '../../../modules/calendar/web/loadPendingReviews';
import { PendingReviews } from '../../../modules/calendar/web/PendingReviews';
import { dayKeyInTZ } from '../../../shared/ui/format/formatInTZ';
import { Icon } from '../../../shared/ui/icons/Icon';

export const dynamic = 'force-dynamic';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type SearchParams = Record<string, string | string[] | undefined>;

function pickFirst(v: string | string[] | undefined): string | null {
  if (v === undefined) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function monthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<ReactElement> {
  const monthParam = pickFirst(searchParams.month);
  const now = new Date();
  const data = await loadCalendarMonth(monthParam, now);
  const pendingReviews = await loadPendingReviews(now);
  const todayKey = dayKeyInTZ(now);

  const cells = buildMonthGrid(data.year, data.monthIndex);

  const eventsByDate: Record<string, CalendarGridEvent[]> = {};
  for (const e of data.entries) {
    const ev: CalendarGridEvent = {
      id: e.id,
      scheduledAt: e.scheduledAt,
      title: e.activity.title,
      venue: e.activity.neighborhood ?? 'Montréal',
      time: formatTime(e.scheduledAt),
      isPast: new Date(e.scheduledAt) < now,
      outcome: e.outcome,
      activity: e.activity,
    };
    (eventsByDate[e.dayKey] = eventsByDate[e.dayKey] ?? []).push(ev);
  }

  const upcoming = data.entries
    .filter((e) => new Date(e.scheduledAt) >= now)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    .slice(0, 6)
    .map((e) => ({
      id: e.id,
      scheduledAt: e.scheduledAt,
      title: e.activity.title,
      venue: e.activity.neighborhood ?? 'Montréal',
      time: formatTime(e.scheduledAt),
      activity: e.activity,
    }));

  const stats = data.entries.reduce(
    (acc, e) => {
      const past = new Date(e.scheduledAt) < now;
      if (past) acc.past += 1;
      else acc.booked += 1;
      acc.total += 1;
      return acc;
    },
    { booked: 0, past: 0, total: 0 },
  );

  const prevHref = `/calendar?month=${monthKey(data.prev.year, data.prev.monthIndex)}`;
  const nextHref = `/calendar?month=${monthKey(data.next.year, data.next.monthIndex)}`;
  const todayHref = `/calendar?month=${monthKey(now.getFullYear(), now.getMonth())}`;

  return (
    <div className="cal-shell">
      <div className="cal-main">
        <div className="cal-header">
          <div>
            <h1>Your Calendar</h1>
            <p>Everything you&rsquo;ve booked, saved or want to revisit — in one place.</p>
          </div>
          <div className="cal-toolbar">
            <Link href={todayHref} className="chat-tool">
              Today
            </Link>
            <div className="cal-month">
              <Link href={prevHref} className="cal-icon-btn" aria-label="Previous month">
                <Icon name="chev-left" size={14} />
              </Link>
              <span className="cal-month-name">
                {MONTHS[data.monthIndex]} {data.year}
              </span>
              <Link href={nextHref} className="cal-icon-btn" aria-label="Next month">
                <Icon name="chev-right" size={14} />
              </Link>
            </div>
            <div className="cal-view-toggle">
              <button type="button" className="active">
                Month
              </button>
              <button type="button" disabled>
                Week
              </button>
              <button type="button" disabled>
                List
              </button>
            </div>
          </div>
        </div>

        <CalendarMonthGrid cells={cells} eventsByDate={eventsByDate} todayKey={todayKey} />
      </div>

      <aside className="cal-side">
        <div className="cal-card">
          <h3>This month</h3>
          <p>{MONTHS[data.monthIndex]} at a glance</p>
          <div className="cal-stats">
            <div className="cal-stat">
              <div className="cal-stat-val">{stats.booked}</div>
              <div className="cal-stat-key">Booked</div>
            </div>
            <div className="cal-stat">
              <div className="cal-stat-val">{stats.past}</div>
              <div className="cal-stat-key">Attended</div>
            </div>
            <div className="cal-stat">
              <div className="cal-stat-val">{stats.total}</div>
              <div className="cal-stat-key">Total plans</div>
            </div>
          </div>
        </div>

        {pendingReviews.length > 0 ? (
          <div className="cal-card">
            <h3>À noter</h3>
            <p>Vos sorties passées — dites-nous comment c&rsquo;était</p>
            <PendingReviews items={pendingReviews} />
          </div>
        ) : null}

        <div className="cal-card">
          <h3>Upcoming</h3>
          <p>Next 6 plans on your calendar</p>
          <CalendarUpcomingList items={upcoming} />
        </div>

        <div className="cal-card">
          <h3>Legend</h3>
          <div className="cal-legend" style={{ marginTop: 6 }}>
            <div className="cal-legend-row">
              <span className="cal-legend-swatch" /> Booked — confirmed
            </div>
            <div className="cal-legend-row">
              <span className="cal-legend-swatch ink" /> Attended — past
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
