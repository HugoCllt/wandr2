import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import { Icon } from '../ui/Icon';
import { useReviewEntry } from '../lib/queries/useCalendar';

const NOTE_MAX_LENGTH = 280;
const SATISFACTION_LABELS = ['Décevant', 'Bof', 'Correct', 'Très bien', 'Inoubliable'];

type Outcome = 'DONE' | 'MISSED';

type ReviewBodyProps = {
  entryId: string;
  activityTitle: string;
  defaultOutcome?: Outcome;
  onClose: () => void;
};

export function ReviewBody({ entryId, activityTitle, defaultOutcome = 'DONE', onClose }: ReviewBodyProps) {
  const insets = useSafeAreaInsets();
  const [outcome, setOutcome] = useState<Outcome>(defaultOutcome);
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const reviewEntry = useReviewEntry();

  async function handleSubmit() {
    if (outcome === 'DONE' && satisfaction === null) return;
    setError(null);
    try {
      await reviewEntry.mutateAsync({
        entryId,
        outcome,
        satisfaction: outcome === 'DONE' ? satisfaction : null,
        reviewNote: note.trim().length > 0 ? note.trim() : null,
      });
      onClose();
    } catch {
      setError('Échec de l’enregistrement.');
    }
  }

  const valid = outcome === 'MISSED' || satisfaction !== null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="title" color={theme.colors.ink}>
            Comment c’était ?
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
        <View style={styles.segment}>
          <Pressable
            onPress={() => setOutcome('DONE')}
            accessibilityRole="button"
            accessibilityState={{ selected: outcome === 'DONE' }}
            style={[styles.segmentButton, outcome === 'DONE' && styles.segmentButtonActive]}
          >
            <AppText variant="subtitle" color={outcome === 'DONE' ? theme.colors.white : theme.colors.ink}>
              Fait
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => setOutcome('MISSED')}
            accessibilityRole="button"
            accessibilityState={{ selected: outcome === 'MISSED' }}
            style={[styles.segmentButton, outcome === 'MISSED' && styles.segmentButtonActive]}
          >
            <AppText variant="subtitle" color={outcome === 'MISSED' ? theme.colors.white : theme.colors.ink}>
              Raté
            </AppText>
          </Pressable>
        </View>

        {outcome === 'DONE' && (
          <View style={styles.satisfactionBlock}>
            <AppText variant="caption" color={theme.colors.smoke}>
              SATISFACTION
            </AppText>
            <View style={styles.satisfactionRow}>
              {[1, 2, 3, 4, 5].map((n) => {
                const active = satisfaction !== null && n <= satisfaction;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setSatisfaction(n)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.satisfactionChip, active && styles.satisfactionChipActive]}
                  >
                    <AppText variant="subtitle" color={active ? theme.colors.white : theme.colors.ink}>
                      {n}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            {satisfaction !== null && (
              <AppText variant="caption" color={theme.colors.brass700} style={styles.satisfactionLabel}>
                {SATISFACTION_LABELS[satisfaction - 1]}
              </AppText>
            )}
          </View>
        )}

        <View style={styles.noteBlock}>
          <AppText variant="caption" color={theme.colors.smoke}>
            NOTE (OPTIONNEL)
          </AppText>
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={NOTE_MAX_LENGTH}
            multiline
            numberOfLines={3}
            placeholder="Un souvenir, un détail à retenir…"
            placeholderTextColor={theme.colors.smoke}
            style={styles.noteInput}
          />
          <AppText variant="caption" color={theme.colors.smoke} style={styles.noteCounter}>
            {note.length}/{NOTE_MAX_LENGTH}
          </AppText>
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
          disabled={!valid || reviewEntry.isPending}
          accessibilityRole="button"
          style={[styles.cta, (!valid || reviewEntry.isPending) && styles.ctaDisabled]}
        >
          <AppText variant="subtitle" color={theme.colors.white}>
            {reviewEntry.isPending ? 'Enregistrement…' : 'Enregistrer'}
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
    gap: theme.space.s4,
  },
  segment: {
    flexDirection: 'row',
    gap: theme.space.s2,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.radius.btn,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: theme.colors.ink,
  },
  satisfactionBlock: {
    gap: theme.space.s2,
  },
  satisfactionRow: {
    flexDirection: 'row',
    gap: theme.space.s2,
  },
  satisfactionChip: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.btn,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satisfactionChipActive: {
    backgroundColor: theme.colors.brass,
  },
  satisfactionLabel: {
    textAlign: 'center',
  },
  noteBlock: {
    gap: theme.space.s2,
  },
  noteInput: {
    minHeight: 80,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    padding: theme.space.s3,
    fontFamily: theme.type.body.fontFamily,
    fontSize: theme.type.body.fontSize,
    color: theme.colors.ink,
    textAlignVertical: 'top',
  },
  noteCounter: {
    textAlign: 'right',
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
