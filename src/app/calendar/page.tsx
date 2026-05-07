import type { ReactElement } from 'react';

import { loadCalendarMonth } from '../../modules/calendar/web/loadCalendarMonth';
import { CalendarEntryList, type CalendarEntryListItem } from '../../shared/ui/CalendarEntryList';
import { CalendarMonthView } from '../../shared/ui/CalendarMonthView';
import { dayKeyInTZ } from '../../shared/ui/format/formatInTZ';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<ReactElement> {
  const monthParam = pickFirst(searchParams.month);
  const dayParam = pickFirst(searchParams.day);

  const now = new Date();
  const data = await loadCalendarMonth(monthParam, now);
  const todayKey = dayKeyInTZ(now);
  const selectedDayKey = dayParam ?? null;
  const dayEntries: CalendarEntryListItem[] = selectedDayKey
    ? data.entries
        .filter((e) => e.dayKey === selectedDayKey)
        .map((e) => ({
          id: e.id,
          scheduledAt: e.scheduledAt,
          notes: e.notes,
          activity: {
            slug: e.activity.slug,
            title: e.activity.title,
            kind: e.activity.kind,
          },
        }))
    : [];

  return (
    <main
      style={{ maxWidth: 880, margin: '0 auto', padding: '24px 16px', display: 'grid', gap: 24 }}
    >
      <header>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#0E0F12' }}>Calendar</h1>
        <p style={{ margin: '4px 0 0 0', color: '#5A5C66' }}>
          Plans and journal — past dates are kept too.
        </p>
      </header>

      <CalendarMonthView
        year={data.year}
        monthIndex={data.monthIndex}
        prev={data.prev}
        next={data.next}
        occupiedDayKeys={data.occupiedDayKeys}
        selectedDayKey={selectedDayKey}
        todayKey={todayKey}
      />

      {selectedDayKey ? (
        <section aria-labelledby="day-heading" style={{ display: 'grid', gap: 12 }}>
          <h2
            id="day-heading"
            style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0E0F12' }}
          >
            {selectedDayKey}
          </h2>
          <CalendarEntryList entries={dayEntries} />
        </section>
      ) : (
        <p style={{ color: '#5A5C66', margin: 0 }}>Select a day to see its entries.</p>
      )}
    </main>
  );
}

function pickFirst(v: string | string[] | undefined): string | null {
  if (v === undefined) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}
