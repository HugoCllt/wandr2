import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import { Icon } from '../ui/Icon';
import { ApiError } from '../lib/api';
import { useAddToCalendar } from '../lib/queries/useCalendar';

const UPCOMING_DAYS = 14;
const START_HOUR = 6;
const END_HOUR = 23;

const DAY_LABELS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

type DayOption = {
  key: string;
  label: string;
  dayNumber: number;
  year: number;
  monthIndex: number;
  date: number;
};

function buildUpcomingDays(count: number): DayOption[] {
  const today = new Date();
  const days: DayOption[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    days.push({
      key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
      label: DAY_LABELS[d.getDay()],
      dayNumber: d.getDate(),
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      date: d.getDate(),
    });
  }
  return days;
}

const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
})();

type AddToCalendarBodyProps = {
  activityId: string;
  activityTitle: string;
  onClose: () => void;
  onSaved: () => void;
};

export function AddToCalendarBody({ activityId, activityTitle, onClose, onSaved }: AddToCalendarBodyProps) {
  const insets = useSafeAreaInsets();
  const days = useMemo(() => buildUpcomingDays(UPCOMING_DAYS), []);
  const [selectedDay, setSelectedDay] = useState<DayOption>(days[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const addToCalendar = useAddToCalendar();

  async function handleSubmit() {
    if (!selectedTime || pending) return;
    setError(null);
    setPending(true);
    const [hour, minute] = selectedTime.split(':').map(Number);
    const scheduledAt = new Date(
      selectedDay.year,
      selectedDay.monthIndex,
      selectedDay.date,
      hour,
      minute,
    ).toISOString();

    try {
      await addToCalendar.mutateAsync({ activityId, scheduledAt });
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Activité introuvable.');
      } else {
        setError('Échec de l’ajout au calendrier.');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="title" color={theme.colors.ink}>
            Ajouter au calendrier
          </AppText>
          <AppText variant="body" color={theme.colors.smoke} numberOfLines={2}>
            {activityTitle}
          </AppText>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          style={styles.closeButton}
        >
          <Icon name="close" size={18} color={theme.colors.ink} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="caption" color={theme.colors.smoke}>
          JOUR
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayScroll}
          contentContainerStyle={styles.dayScrollContent}
        >
          {days.map((day) => {
            const active = day.key === selectedDay.key;
            return (
              <Pressable
                key={day.key}
                onPress={() => setSelectedDay(day)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.dayPill, active && styles.dayPillActive]}
              >
                <AppText variant="caption" color={active ? theme.colors.white : theme.colors.smoke}>
                  {day.label.toUpperCase()}
                </AppText>
                <AppText variant="subtitle" color={active ? theme.colors.white : theme.colors.ink}>
                  {day.dayNumber}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <AppText variant="caption" color={theme.colors.smoke} style={styles.sectionLabel}>
          HEURE
        </AppText>
        <View style={styles.slotGrid}>
          {TIME_SLOTS.map((slot) => {
            const active = slot === selectedTime;
            return (
              <Pressable
                key={slot}
                onPress={() => setSelectedTime(slot)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.slotChip, active && styles.slotChipActive]}
              >
                <AppText variant="caption" color={active ? theme.colors.white : theme.colors.ink}>
                  {slot}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: Math.max(theme.space.s6, theme.space.s3 + insets.bottom) }]}>
        {error && (
          <View style={styles.errorBox}>
            <AppText variant="caption" color={theme.colors.live} accessibilityRole="alert">
              {error}
            </AppText>
          </View>
        )}
        <Pressable
          onPress={handleSubmit}
          disabled={!selectedTime || pending}
          accessibilityRole="button"
          style={[styles.cta, (!selectedTime || pending) && styles.ctaDisabled]}
        >
          <AppText variant="subtitle" color={theme.colors.white}>
            {pending ? 'Enregistrement…' : 'Ajouter au calendrier'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.s3,
    paddingHorizontal: theme.space.s5,
    paddingTop: theme.space.s4,
    paddingBottom: theme.space.s3,
  },
  headerText: {
    flex: 1,
    gap: theme.space.s1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.space.s5,
    paddingBottom: theme.space.s5,
    gap: theme.space.s2,
  },
  sectionLabel: {
    marginTop: theme.space.s5,
  },
  dayScroll: {
    marginTop: theme.space.s2,
  },
  dayScrollContent: {
    gap: theme.space.s2,
    paddingRight: theme.space.s4,
  },
  dayPill: {
    width: 56,
    height: 64,
    borderRadius: theme.radius.btn,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayPillActive: {
    backgroundColor: theme.colors.brass,
  },
  slotGrid: {
    marginTop: theme.space.s2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.s2,
  },
  slotChip: {
    minWidth: 68,
    height: 44,
    paddingHorizontal: theme.space.s3,
    borderRadius: theme.radius.btn,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotChipActive: {
    backgroundColor: theme.colors.brass,
  },
  errorBox: {
    marginBottom: theme.space.s3,
    padding: theme.space.s3,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.liveTint,
  },
  ctaBar: {
    paddingHorizontal: theme.space.s5,
    paddingTop: theme.space.s3,
    paddingBottom: theme.space.s6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    backgroundColor: theme.colors.surface2,
  },
  cta: {
    minHeight: 44,
    borderRadius: theme.radius.btn,
    backgroundColor: theme.colors.brass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.5,
  },
});
