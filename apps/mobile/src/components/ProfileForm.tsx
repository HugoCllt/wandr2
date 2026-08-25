import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import {
  PROFILE_AFFINITY_CATEGORIES,
  type ProfileAffinityCategory,
  type ProfileFormDTO,
  type ProfileGender,
} from '@wandr/shared';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import { Icon } from '../ui/Icon';
import { categoryIconFor, categoryLabelFor } from './cardMeta';

const BIO_MAX = 280;

const GENDERS: { value: ProfileGender; label: string }[] = [
  { value: 'FEMALE', label: 'Femme' },
  { value: 'MALE', label: 'Homme' },
  { value: 'OTHER', label: 'Autre' },
];

export type ProfileFormInitial = {
  birthDate: string;
  gender: ProfileGender | '';
  cityId: string;
  cityName: string;
  bio: string;
  affinities: Record<ProfileAffinityCategory, number>;
};

type Props = {
  initial: ProfileFormInitial;
  dismissable: boolean;
  onSubmit: (form: ProfileFormDTO) => Promise<void>;
  onClose?: () => void;
  onSignOut?: () => void;
  edges?: readonly Edge[];
};

const DEFAULT_EDGES: readonly Edge[] = ['top', 'bottom', 'left', 'right'];

function splitBirthDate(birthDate: string): { day: string; month: string; year: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return { day: '', month: '', year: '' };
  return { year: match[1], month: match[2], day: match[3] };
}

function parseBirthDate(day: string, month: string, year: string): string | null {
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) return null;
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (y < 1900 || y > new Date().getFullYear()) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  if (date.getTime() > Date.now()) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function ProfileForm({
  initial,
  dismissable,
  onSubmit,
  onClose,
  onSignOut,
  edges = DEFAULT_EDGES,
}: Props) {
  const initialDate = splitBirthDate(initial.birthDate);
  const [day, setDay] = useState(initialDate.day);
  const [month, setMonth] = useState(initialDate.month);
  const [year, setYear] = useState(initialDate.year);
  const [gender, setGender] = useState<ProfileGender | ''>(initial.gender);
  const [bio, setBio] = useState(initial.bio);
  const [affinities, setAffinities] = useState<Record<ProfileAffinityCategory, number>>(
    initial.affinities,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function adjustAffinity(category: ProfileAffinityCategory, delta: number) {
    setAffinities((prev) => ({
      ...prev,
      [category]: Math.min(10, Math.max(0, prev[category] + delta)),
    }));
  }

  async function handleSubmit() {
    if (busy) return;
    setError(null);
    if (!initial.cityId) {
      setError('Votre ville n’a pas pu être déterminée. Déconnectez-vous, puis reconnectez-vous.');
      return;
    }
    const birthDate = parseBirthDate(day, month, year);
    if (!birthDate) {
      setError('Veuillez entrer une date de naissance valide.');
      return;
    }
    if (!gender) {
      setError('Veuillez sélectionner un genre.');
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ birthDate, gender, cityId: initial.cityId, bio, affinities });
    } catch {
      setError('Impossible d’enregistrer votre profil. Réessayez.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText variant="title" color={theme.colors.ink}>
                {dismissable ? 'Modifier le profil' : 'Bienvenue sur Wandr'}
              </AppText>
              <AppText variant="body" color={theme.colors.smoke} style={styles.subtitle}>
                {dismissable
                  ? 'Ajustez vos informations et vos affinités.'
                  : `Configurez votre profil pour personnaliser votre fil à ${initial.cityName}.`}
              </AppText>
            </View>
            {dismissable && onClose && (
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                style={styles.closeButton}
              >
                <Icon name="close" size={18} color={theme.colors.ink} strokeWidth={2} />
              </Pressable>
            )}
          </View>

          <View style={styles.field}>
            <AppText variant="caption" color={theme.colors.smoke}>
              DATE DE NAISSANCE
            </AppText>
            <View style={styles.dateRow}>
              <TextInput
                value={day}
                onChangeText={setDay}
                placeholder="JJ"
                placeholderTextColor={theme.colors.silver}
                keyboardType="number-pad"
                maxLength={2}
                accessibilityLabel="Jour de naissance"
                style={[styles.input, styles.dateInputSmall]}
              />
              <TextInput
                value={month}
                onChangeText={setMonth}
                placeholder="MM"
                placeholderTextColor={theme.colors.silver}
                keyboardType="number-pad"
                maxLength={2}
                accessibilityLabel="Mois de naissance"
                style={[styles.input, styles.dateInputSmall]}
              />
              <TextInput
                value={year}
                onChangeText={setYear}
                placeholder="AAAA"
                placeholderTextColor={theme.colors.silver}
                keyboardType="number-pad"
                maxLength={4}
                accessibilityLabel="Année de naissance"
                style={[styles.input, styles.dateInputLarge]}
              />
            </View>
          </View>

          <View style={styles.field}>
            <AppText variant="caption" color={theme.colors.smoke}>
              GENRE
            </AppText>
            <View style={styles.chipRow}>
              {GENDERS.map((g) => {
                const active = gender === g.value;
                return (
                  <Pressable
                    key={g.value}
                    onPress={() => setGender(g.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.genderChip, active && styles.genderChipActive]}
                  >
                    <AppText variant="subtitle" color={active ? theme.colors.white : theme.colors.ink}>
                      {g.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.bioHeader}>
              <AppText variant="caption" color={theme.colors.smoke}>
                BIO
              </AppText>
              <AppText variant="caption" color={theme.colors.smoke}>
                {bio.length}/{BIO_MAX}
              </AppText>
            </View>
            <TextInput
              value={bio}
              onChangeText={setBio}
              maxLength={BIO_MAX}
              multiline
              numberOfLines={3}
              placeholder="Votre ambiance en une phrase…"
              placeholderTextColor={theme.colors.silver}
              style={styles.bioInput}
            />
          </View>

          <View style={styles.field}>
            <AppText variant="caption" color={theme.colors.smoke}>
              VOS AFFINITÉS
            </AppText>
            <View style={styles.affinityList}>
              {PROFILE_AFFINITY_CATEGORIES.map((category) => {
                const value = affinities[category];
                const label = categoryLabelFor(category);
                return (
                  <View key={category} style={styles.affinityRow}>
                    <View style={styles.affinityIconMark}>
                      <Icon name={categoryIconFor(category)} size={16} color={theme.colors.brass} strokeWidth={1.6} />
                    </View>
                    <AppText variant="body" color={theme.colors.ink} style={styles.affinityLabel}>
                      {label}
                    </AppText>
                    <Pressable
                      onPress={() => adjustAffinity(category, -1)}
                      disabled={value <= 0}
                      accessibilityRole="button"
                      accessibilityLabel={`Diminuer l’affinité ${label}`}
                      style={[styles.stepperButton, value <= 0 && styles.stepperButtonDisabled]}
                    >
                      <AppText variant="subtitle" color={theme.colors.ink}>
                        –
                      </AppText>
                    </Pressable>
                    <AppText variant="subtitle" color={theme.colors.ink} style={styles.affinityValue}>
                      {value}
                    </AppText>
                    <Pressable
                      onPress={() => adjustAffinity(category, 1)}
                      disabled={value >= 10}
                      accessibilityRole="button"
                      accessibilityLabel={`Augmenter l’affinité ${label}`}
                      style={[styles.stepperButton, value >= 10 && styles.stepperButtonDisabled]}
                    >
                      <AppText variant="subtitle" color={theme.colors.ink}>
                        +
                      </AppText>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>

          {error && (
            <AppText color={theme.colors.live} accessibilityRole="alert" style={styles.error}>
              {error}
            </AppText>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed, busy && styles.disabled]}
          >
            <AppText variant="subtitle" color={theme.colors.white}>
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </AppText>
          </Pressable>

          {!dismissable && onSignOut && (
            <Pressable onPress={onSignOut} accessibilityRole="button" style={styles.signOut}>
              <AppText variant="body" color={theme.colors.smoke}>
                Se déconnecter
              </AppText>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: theme.space.s5,
    paddingBottom: theme.space.s8,
    gap: theme.space.s4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.space.s3,
  },
  headerText: {
    flex: 1,
    gap: theme.space.s1,
  },
  subtitle: {
    marginTop: theme.space.s1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    gap: theme.space.s2,
  },
  dateRow: {
    flexDirection: 'row',
    gap: theme.space.s2,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderWidth: 1,
    borderRadius: theme.radius.btn,
    paddingHorizontal: theme.space.s3,
    paddingVertical: theme.space.s3,
    fontFamily: theme.type.body.fontFamily,
    fontSize: theme.type.body.fontSize,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  dateInputSmall: {
    width: 64,
  },
  dateInputLarge: {
    width: 96,
  },
  chipRow: {
    flexDirection: 'row',
    gap: theme.space.s2,
  },
  genderChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.radius.btn,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderChipActive: {
    backgroundColor: theme.colors.brass,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bioInput: {
    minHeight: 84,
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
  affinityList: {
    gap: theme.space.s2,
  },
  affinityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s2,
    minHeight: 44,
  },
  affinityIconMark: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brassTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  affinityLabel: {
    flex: 1,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.btn,
    backgroundColor: theme.colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  affinityValue: {
    width: 24,
    textAlign: 'center',
  },
  error: {
    textAlign: 'center',
  },
  cta: {
    minHeight: 44,
    backgroundColor: theme.colors.brass,
    borderRadius: theme.radius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.space.s4,
    marginTop: theme.space.s2,
  },
  ctaPressed: {
    backgroundColor: theme.colors.brass700,
  },
  disabled: {
    opacity: 0.6,
  },
  signOut: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
