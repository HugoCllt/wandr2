import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
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

type AddToCalendarSheetProps = {
  activityId: string;
  activityTitle: string;
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function AddToCalendarSheet({
  activityId,
  activityTitle,
  visible,
  onClose,
  onSaved,
}: AddToCalendarSheetProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const days = useMemo(() => buildUpcomingDays(UPCOMING_DAYS), []);
  const [selectedDay, setSelectedDay] = useState<DayOption>(days[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const addToCalendar = useAddToCalendar();

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  function handleDismiss() {
    setSelectedDay(days[0]);
    setSelectedTime(null);
    setError(null);
    setPending(false);
    onClose();
  }

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
      onSaved?.();
      sheetRef.current?.dismiss();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Activité introuvable.');
      } else {
        setError("Échec de l'ajout au calendrier.");
      }
    } finally {
      setPending(false);
    }
  }

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['80%']}
      enablePanDownToClose
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.header}>
        <AppText variant="title" color={theme.colors.ink}>
          Ajouter au calendrier
        </AppText>
        <AppText variant="body" color={theme.colors.smoke}>
          {activityTitle}
        </AppText>
      </BottomSheetView>

      <BottomSheetScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText variant="caption" color={theme.colors.smoke}>
          JOUR
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll} contentContainerStyle={styles.dayScrollContent}>
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

        {error && (
          <View style={styles.errorBox}>
            <AppText variant="caption" color={theme.colors.live}>
              {error}
            </AppText>
          </View>
        )}
      </BottomSheetScrollView>

      <View style={styles.ctaBar}>
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
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: theme.colors.surface2,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
  },
  handleIndicator: {
    backgroundColor: theme.colors.silver,
    width: 40,
  },
  header: {
    paddingHorizontal: theme.space.s5,
    paddingBottom: theme.space.s3,
    gap: theme.space.s1,
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
    marginTop: theme.space.s3,
    padding: theme.space.s3,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(216,69,63,0.12)',
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
