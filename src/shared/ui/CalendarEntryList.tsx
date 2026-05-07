import Link from 'next/link';
import type { CSSProperties, ReactElement } from 'react';

import { CalendarEntryRemoveButton } from './CalendarEntryRemoveButton';
import { formatTimeInTZ } from './format/formatInTZ';

export type CalendarEntryListItem = {
  id: string;
  scheduledAt: string;
  notes: string | null;
  activity: {
    slug: string;
    title: string;
    kind: 'EVENT' | 'PLACE';
  };
};

type CalendarEntryListProps = {
  entries: ReadonlyArray<CalendarEntryListItem>;
  emptyMessage?: string;
};

export function CalendarEntryList({
  entries,
  emptyMessage = 'No entries on this day.',
}: CalendarEntryListProps): ReactElement {
  if (entries.length === 0) {
    return <p style={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <ul style={styles.list}>
      {entries.map((entry) => (
        <li key={entry.id} style={styles.item}>
          <span style={styles.time}>{formatTimeInTZ(entry.scheduledAt)}</span>
          <div style={styles.body}>
            <Link href={`/activity/${entry.activity.slug}`} style={styles.titleLink}>
              {entry.activity.title}
            </Link>
            {entry.notes ? <p style={styles.notes}>{entry.notes}</p> : null}
          </div>
          <CalendarEntryRemoveButton entryId={entry.id} />
        </li>
      ))}
    </ul>
  );
}

const styles: Record<string, CSSProperties> = {
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gap: 12,
  },
  item: {
    display: 'grid',
    gridTemplateColumns: '64px 1fr auto',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    background: '#FFFFFF',
    border: '1px solid #E5DED1',
    borderRadius: 12,
  },
  time: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 14,
    color: '#0E0F12',
    fontWeight: 600,
  },
  body: {
    display: 'grid',
    gap: 4,
    minWidth: 0,
  },
  titleLink: {
    color: '#0E0F12',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 16,
  },
  notes: {
    margin: 0,
    color: '#5A5C66',
    fontSize: 14,
    lineHeight: 1.4,
  },
  empty: {
    color: '#5A5C66',
    fontSize: 14,
    margin: 0,
  },
};
