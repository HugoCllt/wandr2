import Link from 'next/link';
import type { CSSProperties, ReactElement } from 'react';

import { dayKeyInTZ, formatMonthInTZ } from './format/formatInTZ';

type CalendarMonthViewProps = {
  year: number;
  monthIndex: number;
  prev: { year: number; monthIndex: number };
  next: { year: number; monthIndex: number };
  /** Day keys in YYYY-MM-DD (Montreal TZ) where there is at least one entry. */
  occupiedDayKeys: ReadonlySet<string>;
  /** Currently-selected day key in YYYY-MM-DD (Montreal TZ), or null. */
  selectedDayKey: string | null;
  /** Today's day key in YYYY-MM-DD (Montreal TZ), used to highlight "today". */
  todayKey: string;
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarMonthView({
  year,
  monthIndex,
  prev,
  next,
  occupiedDayKeys,
  selectedDayKey,
  todayKey,
}: CalendarMonthViewProps): ReactElement {
  const monthLabel = formatMonthInTZ(new Date(Date.UTC(year, monthIndex, 15, 12)));

  const cells = buildMonthCells(year, monthIndex);
  const prevHref = `/calendar?month=${pad(prev.year)}-${pad(prev.monthIndex + 1)}`;
  const nextHref = `/calendar?month=${pad(next.year)}-${pad(next.monthIndex + 1)}`;

  return (
    <section aria-label={`Calendar — ${monthLabel}`} style={styles.container}>
      <header style={styles.header}>
        <Link href={prevHref} aria-label="Previous month" style={styles.navButton}>
          ←
        </Link>
        <h2 style={styles.title}>{monthLabel}</h2>
        <Link href={nextHref} aria-label="Next month" style={styles.navButton}>
          →
        </Link>
      </header>

      <div style={styles.weekdayRow} role="row">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} style={styles.weekday} role="columnheader">
            {label}
          </span>
        ))}
      </div>

      <div style={styles.grid} role="grid">
        {cells.map((cell, idx) => {
          if (cell === null) {
            return <span key={`pad-${idx}`} style={styles.cellEmpty} aria-hidden="true" />;
          }
          const dayKey = `${pad(year)}-${pad(monthIndex + 1)}-${pad(cell)}`;
          const isToday = dayKey === todayKey;
          const isSelected = dayKey === selectedDayKey;
          const isOccupied = occupiedDayKeys.has(dayKey);
          const monthParam = `${pad(year)}-${pad(monthIndex + 1)}`;
          const href = `/calendar?month=${monthParam}&day=${dayKey}`;
          const cellStyle: CSSProperties = {
            ...styles.cell,
            ...(isToday ? styles.cellToday : {}),
            ...(isSelected ? styles.cellSelected : {}),
          };
          return (
            <Link
              key={dayKey}
              href={href}
              style={cellStyle}
              aria-current={isToday ? 'date' : undefined}
              aria-selected={isSelected}
              aria-label={`${dayKey}${isOccupied ? ', has entries' : ''}`}
            >
              <span style={styles.dayNumber}>{cell}</span>
              {isOccupied ? <span style={styles.dot} aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function buildMonthCells(year: number, monthIndex: number): Array<number | null> {
  const firstDow = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function todayDayKey(now: Date = new Date()): string {
  return dayKeyInTZ(now);
}

const styles: Record<string, CSSProperties> = {
  container: {
    background: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #E5DED1',
    padding: 16,
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#0E0F12',
    textTransform: 'capitalize',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    border: '1px solid #E5DED1',
    background: '#FFFFFF',
    color: '#0E0F12',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    fontSize: 16,
  },
  weekdayRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    marginBottom: 6,
  },
  weekday: {
    fontSize: 12,
    color: '#5A5C66',
    textAlign: 'center',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4,
  },
  cell: {
    position: 'relative',
    aspectRatio: '1 / 1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    background: '#F2EBE0',
    color: '#0E0F12',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  cellEmpty: {
    aspectRatio: '1 / 1',
  },
  cellToday: {
    border: '2px solid #FF7A33',
    fontWeight: 700,
  },
  cellSelected: {
    background: '#0E0F12',
    color: '#FFFFFF',
  },
  dayNumber: {
    lineHeight: 1,
  },
  dot: {
    position: 'absolute',
    bottom: 6,
    width: 6,
    height: 6,
    borderRadius: 9999,
    background: '#FF7A33',
  },
};
