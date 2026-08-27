import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isDateRange, type FilterValueDTO } from '@wandr/shared';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import { useFacets } from '../lib/queries/useFacets';
import { emptyFilters } from '../lib/filtersState';

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  return [day, month, year].filter(Boolean).join('/');
}

function displayToIso(display: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (month < 1 || month > 12) return null;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;
  return `${yyyy}-${mm}-${dd}`;
}

function isoToDisplay(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

type DateRangeValidation = {
  message: string | null;
  fromInvalid: boolean;
  toInvalid: boolean;
};

function validateDateRange(fromDisplay: string, toDisplay: string): DateRangeValidation {
  const fromComplete = fromDisplay.length === 10;
  const toComplete = toDisplay.length === 10;
  if (!fromComplete && !toComplete) {
    return { message: null, fromInvalid: false, toInvalid: false };
  }
  const isoFrom = fromComplete ? displayToIso(fromDisplay) : null;
  const isoTo = toComplete ? displayToIso(toDisplay) : null;
  const fromInvalid = fromComplete && isoFrom === null;
  const toInvalid = toComplete && isoTo === null;
  if (fromInvalid || toInvalid) {
    return { message: 'Date invalide (JJ/MM/AAAA).', fromInvalid, toInvalid };
  }
  if (isoFrom && isoTo && isoTo < isoFrom) {
    return { message: 'La date de fin doit suivre la date de début.', fromInvalid: false, toInvalid: true };
  }
  return { message: null, fromInvalid: false, toInvalid: false };
}

function initialRange(value: FilterValueDTO): { from: string; to: string } | null {
  return value.date !== undefined && isDateRange(value.date) ? value.date : null;
}

type FilterSheetBodyProps = {
  value: FilterValueDTO;
  onApply: (next: FilterValueDTO) => void;
  onClose: () => void;
};

export function FilterSheetBody({ value, onApply, onClose }: FilterSheetBodyProps) {
  const insets = useSafeAreaInsets();
  const facets = useFacets();

  const [draft, setDraft] = useState<FilterValueDTO>(() => value);
  const [customDate, setCustomDate] = useState(() => initialRange(value) !== null);
  const [fromText, setFromText] = useState(() => {
    const range = initialRange(value);
    return range !== null ? isoToDisplay(range.from) : '';
  });
  const [toText, setToText] = useState(() => {
    const range = initialRange(value);
    return range !== null ? isoToDisplay(range.to) : '';
  });
  const [priceMaxText, setPriceMaxText] = useState(() =>
    value.priceMax !== undefined ? String(value.priceMax) : '',
  );

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleReset() {
    setDraft(emptyFilters());
    setCustomDate(false);
    setFromText('');
    setToText('');
    setPriceMaxText('');
  }

  function selectKind(kind: FilterValueDTO['kind']) {
    setDraft((prev) => ({ ...prev, kind }));
  }

  function selectDatePreset(preset: 'today' | 'weekend') {
    setCustomDate(false);
    setFromText('');
    setToText('');
    setDraft((prev) => ({ ...prev, date: prev.date === preset ? undefined : preset }));
  }

  function toggleCustomDate() {
    const next = !customDate;
    setCustomDate(next);
    if (!next) {
      setFromText('');
      setToText('');
      setDraft((prev) => ({ ...prev, date: typeof prev.date === 'object' ? undefined : prev.date }));
    }
  }

  function commitCustomRangeIfValid(fromDisplay: string, toDisplay: string) {
    const { message } = validateDateRange(fromDisplay, toDisplay);
    if (message) return;
    const isoFrom = displayToIso(fromDisplay);
    const isoTo = displayToIso(toDisplay);
    if (isoFrom && isoTo) {
      setDraft((prev) => ({ ...prev, date: { from: isoFrom, to: isoTo } }));
    }
  }

  function handleFromChange(raw: string) {
    const formatted = formatDateInput(raw);
    setFromText(formatted);
    commitCustomRangeIfValid(formatted, toText);
  }

  function handleToChange(raw: string) {
    const formatted = formatDateInput(raw);
    setToText(formatted);
    commitCustomRangeIfValid(fromText, formatted);
  }

  function toggleNeighborhood(name: string) {
    setDraft((prev) => {
      const current = new Set(prev.neighborhood ?? []);
      if (current.has(name)) {
        current.delete(name);
      } else {
        current.add(name);
      }
      const list = [...current];
      return { ...prev, neighborhood: list.length === 0 ? undefined : list };
    });
  }

  function handlePriceMaxChange(raw: string) {
    const digits = raw.replace(/\D/g, '');
    setPriceMaxText(digits);
    setDraft((prev) => ({ ...prev, priceMax: digits === '' ? undefined : Number(digits) }));
  }

  function selectFree() {
    setDraft((prev) => ({ ...prev, free: prev.free === true ? undefined : true, paid: undefined }));
  }

  function selectPaid() {
    setDraft((prev) => ({ ...prev, paid: prev.paid === true ? undefined : true, free: undefined }));
  }

  function toggleIndoor() {
    setDraft((prev) => ({ ...prev, indoor: prev.indoor === true ? undefined : true }));
  }

  function toggleOutdoor() {
    setDraft((prev) => ({ ...prev, outdoor: prev.outdoor === true ? undefined : true }));
  }

  const neighborhoodOptions = facets.data?.items ?? [];

  const dateValidation = customDate
    ? validateDateRange(fromText, toText)
    : { message: null, fromInvalid: false, toInvalid: false };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AppText variant="title" color={theme.colors.ink}>
          Filtres
        </AppText>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Type">
          <View style={styles.chipRow}>
            <Chip label="Tous" active={draft.kind === undefined} onPress={() => selectKind(undefined)} />
            <Chip label="Événements" active={draft.kind === 'EVENT'} onPress={() => selectKind('EVENT')} />
            <Chip label="Lieux" active={draft.kind === 'PLACE'} onPress={() => selectKind('PLACE')} />
          </View>
        </Section>

        <Section title="Date">
          <View style={styles.chipRow}>
            <Chip
              label="Aujourd’hui"
              active={draft.date === 'today'}
              onPress={() => selectDatePreset('today')}
            />
            <Chip
              label="Ce week-end"
              active={draft.date === 'weekend'}
              onPress={() => selectDatePreset('weekend')}
            />
            <Chip label="Dates précises" active={customDate} onPress={toggleCustomDate} />
          </View>
          {customDate && (
            <View style={styles.dateRangeRow}>
              <View style={styles.dateField}>
                <AppText variant="caption" color={theme.colors.smoke}>
                  Du
                </AppText>
                <TextInput
                  value={fromText}
                  onChangeText={handleFromChange}
                  placeholder="JJ/MM/AAAA"
                  placeholderTextColor={theme.colors.smoke}
                  keyboardType="number-pad"
                  maxLength={10}
                  style={[styles.dateInput, dateValidation.fromInvalid && styles.dateInputError]}
                />
              </View>
              <View style={styles.dateField}>
                <AppText variant="caption" color={theme.colors.smoke}>
                  Au
                </AppText>
                <TextInput
                  value={toText}
                  onChangeText={handleToChange}
                  placeholder="JJ/MM/AAAA"
                  placeholderTextColor={theme.colors.smoke}
                  keyboardType="number-pad"
                  maxLength={10}
                  style={[styles.dateInput, dateValidation.toInvalid && styles.dateInputError]}
                />
              </View>
            </View>
          )}
          {customDate && dateValidation.message && (
            <AppText variant="caption" color={theme.colors.live} style={styles.dateErrorText}>
              {dateValidation.message}
            </AppText>
          )}
        </Section>

        <Section title="Quartiers">
          {facets.isLoading ? (
            <ActivityIndicator color={theme.colors.brass} style={styles.facetsLoading} />
          ) : facets.isError ? (
            <View style={styles.facetsError}>
              <AppText variant="body" color={theme.colors.smoke}>
                Impossible de charger les quartiers.
              </AppText>
              <Pressable
                onPress={() => facets.refetch()}
                accessibilityRole="button"
                style={styles.facetsRetry}
              >
                <AppText variant="subtitle" color={theme.colors.brass}>
                  Réessayer
                </AppText>
              </Pressable>
            </View>
          ) : neighborhoodOptions.length === 0 ? (
            <AppText variant="body" color={theme.colors.smoke}>
              Aucun quartier disponible.
            </AppText>
          ) : (
            <View style={styles.chipRow}>
              {neighborhoodOptions.map((option) => (
                <Chip
                  key={option.name}
                  label={option.name}
                  active={(draft.neighborhood ?? []).includes(option.name)}
                  onPress={() => toggleNeighborhood(option.name)}
                />
              ))}
            </View>
          )}
        </Section>

        <Section title="Prix">
          <TextInput
            value={priceMaxText}
            onChangeText={handlePriceMaxChange}
            placeholder="Prix max ($ CAD)"
            placeholderTextColor={theme.colors.smoke}
            keyboardType="number-pad"
            style={styles.priceInput}
          />
          <View style={[styles.chipRow, styles.chipRowSpaced]}>
            <Chip label="Gratuit" active={draft.free === true} onPress={selectFree} />
            <Chip label="Payant" active={draft.paid === true} onPress={selectPaid} />
          </View>
        </Section>

        <Section title="Cadre">
          <View style={styles.chipRow}>
            <Chip label="Intérieur" active={draft.indoor === true} onPress={toggleIndoor} />
            <Chip label="Extérieur" active={draft.outdoor === true} onPress={toggleOutdoor} />
          </View>
        </Section>
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: Math.max(theme.space.s6, theme.space.s3 + insets.bottom) }]}>
        <Pressable onPress={handleReset} accessibilityRole="button" style={styles.resetButton}>
          <AppText variant="subtitle" color={theme.colors.ink}>
            Réinitialiser
          </AppText>
        </Pressable>
        <Pressable onPress={handleApply} accessibilityRole="button" style={styles.cta}>
          <AppText variant="subtitle" color={theme.colors.white}>
            Voir les résultats
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="label" color={theme.colors.smoke}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <AppText variant="subtitle" color={active ? theme.colors.white : theme.colors.ink}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.space.s5,
    paddingTop: theme.space.s4,
    paddingBottom: theme.space.s3,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.space.s5,
    paddingBottom: theme.space.s5,
    gap: theme.space.s5,
  },
  section: {
    gap: theme.space.s2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.s2,
  },
  chipRowSpaced: {
    marginTop: theme.space.s2,
  },
  facetsLoading: {
    alignSelf: 'flex-start',
    paddingVertical: theme.space.s3,
  },
  facetsError: {
    gap: theme.space.s2,
  },
  facetsRetry: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: theme.space.s4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: theme.colors.brass,
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: theme.space.s3,
    marginTop: theme.space.s2,
  },
  dateField: {
    flex: 1,
    gap: theme.space.s1,
  },
  dateInput: {
    height: 44,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.space.s3,
    fontFamily: theme.type.body.fontFamily,
    fontSize: theme.type.body.fontSize,
    color: theme.colors.ink,
  },
  dateInputError: {
    borderColor: theme.colors.live,
  },
  dateErrorText: {
    marginTop: theme.space.s2,
  },
  priceInput: {
    height: 44,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.space.s3,
    fontFamily: theme.type.body.fontFamily,
    fontSize: theme.type.body.fontSize,
    color: theme.colors.ink,
  },
  ctaBar: {
    flexDirection: 'row',
    gap: theme.space.s3,
    paddingHorizontal: theme.space.s5,
    paddingTop: theme.space.s3,
    paddingBottom: theme.space.s6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    backgroundColor: theme.colors.surface2,
  },
  resetButton: {
    minHeight: 44,
    paddingHorizontal: theme.space.s4,
    borderRadius: theme.radius.btn,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.radius.btn,
    backgroundColor: theme.colors.brass,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
