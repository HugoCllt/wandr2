import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../src/theme/tokens';
import { AppText } from '../../src/ui/AppText';
import { Icon } from '../../src/ui/Icon';
import { SectionHeader } from '../../src/components/SectionHeader';
import { MonthGrid, MONTHS_FULL, type MonthGridEntry } from '../../src/components/MonthGrid';
import { UpcomingList, type UpcomingItem } from '../../src/components/UpcomingList';
import { ReviewSheet } from '../../src/components/ReviewSheet';
import { localDayKey } from '../../src/lib/monthGrid';
import {
  useCalendarEntries,
  usePendingReviews,
  useUpcomingEntries,
} from '../../src/lib/queries/useCalendar';

const UPCOMING_LIMIT = 6;

function monthRangeIso(year: number, monthIndex: number): { from: string; to: string } {
  const from = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const to = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
}

type ActiveReview = {
  entryId: string;
  title: string;
  defaultOutcome: 'DONE' | 'MISSED';
};

export default function CalendarScreen() {
  const [viewed, setViewed] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  });
  const [activeReview, setActiveReview] = useState<ActiveReview | null>(null);

  const [now] = useState(() => new Date());
  const { from, to } = useMemo(() => monthRangeIso(viewed.year, viewed.monthIndex), [viewed]);
  const entriesQuery = useCalendarEntries(from, to);
  const pendingQuery = usePendingReviews();
  const upcomingQuery = useUpcomingEntries();

  const todayKey = localDayKey(now.toISOString());
  const nowMs = now.getTime();

  const entriesByDay = useMemo(() => {
    const map: Record<string, MonthGridEntry[]> = {};
    for (const entry of entriesQuery.data ?? []) {
      const key = localDayKey(entry.scheduledAt);
      const bucket = map[key] ?? [];
      bucket.push({ id: entry.id, outcome: entry.outcome, isPast: new Date(entry.scheduledAt).getTime() < nowMs });
      map[key] = bucket;
    }
    return map;
  }, [entriesQuery.data, nowMs]);

  const upcomingItems: UpcomingItem[] = useMemo(() => {
    return (upcomingQuery.data ?? [])
      .filter((entry) => new Date(entry.scheduledAt).getTime() >= nowMs)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .slice(0, UPCOMING_LIMIT)
      .map((entry) => ({
        id: entry.id,
        scheduledAt: entry.scheduledAt,
        title: entry.activity?.title ?? 'Activité',
        venue: entry.activity ? (entry.activity.kind === 'EVENT' ? 'Événement' : 'Lieu') : 'Montréal',
        slug: entry.activity?.slug ?? null,
      }));
  }, [upcomingQuery.data, nowMs]);

  const pendingItems = (pendingQuery.data ?? []).map((entry) => ({
    id: entry.id,
    scheduledAt: entry.scheduledAt,
    title: entry.activity?.title ?? 'Activité',
  }));

  function goPrevMonth() {
    setViewed((v) => {
      const d = new Date(v.year, v.monthIndex - 1, 1);
      return { year: d.getFullYear(), monthIndex: d.getMonth() };
    });
  }

  function goNextMonth() {
    setViewed((v) => {
      const d = new Date(v.year, v.monthIndex + 1, 1);
      return { year: d.getFullYear(), monthIndex: d.getMonth() };
    });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText variant="display" color={theme.colors.ink}>
          Calendrier
        </AppText>

        <View style={styles.monthNav}>
          <Pressable
            onPress={goPrevMonth}
            accessibilityRole="button"
            accessibilityLabel="Mois précédent"
            style={styles.navButton}
          >
            <View style={styles.navIconLeft}>
              <Icon name="arrow" size={16} color={theme.colors.ink} />
            </View>
          </Pressable>
          <AppText variant="subtitle" color={theme.colors.ink}>
            {MONTHS_FULL[viewed.monthIndex]} {viewed.year}
          </AppText>
          <Pressable
            onPress={goNextMonth}
            accessibilityRole="button"
            accessibilityLabel="Mois suivant"
            style={styles.navButton}
          >
            <Icon name="arrow" size={16} color={theme.colors.ink} />
          </Pressable>
        </View>

        {entriesQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.brass} style={styles.gridLoading} />
        ) : entriesQuery.isError ? (
          <View style={styles.gridError}>
            <AppText variant="body" color={theme.colors.smoke} style={styles.gridErrorText}>
              Impossible de charger le calendrier.
            </AppText>
            <Pressable
              onPress={() => entriesQuery.refetch()}
              accessibilityRole="button"
              style={styles.gridErrorButton}
            >
              <AppText variant="subtitle" color={theme.colors.brass}>
                Réessayer
              </AppText>
            </Pressable>
          </View>
        ) : (
          <MonthGrid year={viewed.year} monthIndex={viewed.monthIndex} entriesByDay={entriesByDay} todayKey={todayKey} />
        )}

        {pendingItems.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="À noter" />
            <View style={styles.pendingList}>
              {pendingItems.map((item) => (
                <View key={item.id} style={styles.pendingRow}>
                  <View style={styles.pendingInfo}>
                    <AppText variant="subtitle" color={theme.colors.ink} numberOfLines={1}>
                      {item.title}
                    </AppText>
                    <AppText variant="caption" color={theme.colors.smoke}>
                      {formatShortDate(item.scheduledAt)}
                    </AppText>
                  </View>
                  <View style={styles.pendingActions}>
                    <Pressable
                      onPress={() =>
                        setActiveReview({ entryId: item.id, title: item.title, defaultOutcome: 'DONE' })
                      }
                      accessibilityRole="button"
                      style={styles.pendingButtonDone}
                    >
                      <AppText variant="caption" color={theme.colors.white}>
                        Fait
                      </AppText>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setActiveReview({ entryId: item.id, title: item.title, defaultOutcome: 'MISSED' })
                      }
                      accessibilityRole="button"
                      style={styles.pendingButtonMissed}
                    >
                      <AppText variant="caption" color={theme.colors.ink}>
                        Raté
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader title="Prochaines sorties" />
          {upcomingQuery.isLoading ? (
            <ActivityIndicator color={theme.colors.brass} style={styles.gridLoading} />
          ) : upcomingQuery.isError ? (
            <View style={styles.gridError}>
              <AppText variant="body" color={theme.colors.smoke} style={styles.gridErrorText}>
                Impossible de charger vos prochaines sorties.
              </AppText>
              <Pressable
                onPress={() => upcomingQuery.refetch()}
                accessibilityRole="button"
                style={styles.gridErrorButton}
              >
                <AppText variant="subtitle" color={theme.colors.brass}>
                  Réessayer
                </AppText>
              </Pressable>
            </View>
          ) : (
            <UpcomingList items={upcomingItems} />
          )}
        </View>
      </ScrollView>

      <ReviewSheet
        entryId={activeReview?.entryId ?? null}
        activityTitle={activeReview?.title ?? ''}
        defaultOutcome={activeReview?.defaultOutcome}
        visible={activeReview !== null}
        onClose={() => setActiveReview(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
  },
  content: {
    padding: theme.space.s4,
    gap: theme.space.s4,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconLeft: {
    transform: [{ rotate: '180deg' }],
  },
  gridLoading: {
    paddingVertical: theme.space.s6,
  },
  gridError: {
    alignItems: 'center',
    gap: theme.space.s3,
    paddingVertical: theme.space.s6,
  },
  gridErrorText: {
    textAlign: 'center',
  },
  gridErrorButton: {
    minHeight: 44,
    paddingHorizontal: theme.space.s5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: theme.space.s3,
  },
  pendingList: {
    gap: theme.space.s2,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.space.s3,
    gap: theme.space.s2,
  },
  pendingInfo: {
    flex: 1,
    gap: 2,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: theme.space.s2,
  },
  pendingButtonDone: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: theme.space.s3,
    borderRadius: theme.radius.btn,
    backgroundColor: theme.colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingButtonMissed: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: theme.space.s3,
    borderRadius: theme.radius.btn,
    backgroundColor: theme.colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
