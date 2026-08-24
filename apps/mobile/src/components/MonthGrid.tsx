import { StyleSheet, View } from 'react-native';
import type { CalendarOutcome } from '@wandr/shared';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import { buildMonthGrid, dayKey } from '../lib/monthGrid';

export type MonthGridEntry = {
  id: string;
  outcome: CalendarOutcome;
  isPast: boolean;
};

type MonthGridProps = {
  year: number;
  monthIndex: number;
  entriesByDay: Record<string, MonthGridEntry[]>;
  todayKey: string;
};

const WEEKDAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

function dotColor(entries: MonthGridEntry[]): { color: string; opacity: number } {
  if (entries.some((e) => e.outcome === 'DONE')) return { color: theme.colors.teal, opacity: 1 };
  if (entries.some((e) => e.outcome === 'MISSED')) return { color: theme.colors.smoke, opacity: 1 };
  const isPast = entries.every((e) => e.isPast);
  return { color: theme.colors.brass, opacity: isPast ? 0.45 : 1 };
}

export function MonthGrid({ year, monthIndex, entriesByDay, todayKey }: MonthGridProps) {
  const cells = buildMonthGrid(year, monthIndex);

  return (
    <View>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <AppText variant="caption" color={theme.colors.smoke}>
              {label}
            </AppText>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell, i) => {
          const key = dayKey(cell.year, cell.monthIndex, cell.day);
          const entries = entriesByDay[key] ?? [];
          const isToday = key === todayKey;
          const dot = entries.length > 0 ? dotColor(entries) : null;
          return (
            <View key={i} style={styles.cell}>
              <View style={[styles.dayCircle, isToday && styles.dayCircleToday]}>
                <AppText
                  variant="title"
                  color={cell.outside ? theme.colors.silver : isToday ? theme.colors.white : theme.colors.ink}
                  style={styles.dayNumber}
                >
                  {cell.day}
                </AppText>
              </View>
              {dot && <View style={[styles.dot, { backgroundColor: dot.color, opacity: dot.opacity }]} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const CELL_WIDTH = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayCell: {
    width: CELL_WIDTH,
    alignItems: 'center',
    paddingBottom: theme.space.s2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_WIDTH,
    alignItems: 'center',
    paddingVertical: theme.space.s1,
    gap: 4,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: theme.colors.ink,
  },
  dayNumber: {
    fontSize: 15,
    lineHeight: 18,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: theme.radius.pill,
  },
});
