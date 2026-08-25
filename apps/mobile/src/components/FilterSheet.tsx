import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isDateRange, type FilterValueDTO } from '@wandr/shared';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import { Icon } from '../ui/Icon';
import { useFacets } from '../lib/queries/useFacets';
import { emptyFilters } from '../lib/filtersState';

export const FILTER_TRIGGER_CLEARANCE = 76;

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

type FilterSheetProps = {
  visible: boolean;
  value: FilterValueDTO;
  onApply: (next: FilterValueDTO) => void;
  onClose: () => void;
};

export function FilterSheet({ visible, value, onApply, onClose }: FilterSheetProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const facets = useFacets();

  const [wasVisible, setWasVisible] = useState(visible);
  const [draft, setDraft] = useState<FilterValueDTO>(value);
  const [customDate, setCustomDate] = useState(false);
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [priceMaxText, setPriceMaxText] = useState('');

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDraft(value);
      const range = value.date !== undefined && isDateRange(value.date) ? value.date : null;
      setCustomDate(range !== null);
      setFromText(range !== null ? isoToDisplay(range.from) : '');
      setToText(range !== null ? isoToDisplay(range.to) : '');
      setPriceMaxText(value.priceMax !== undefined ? String(value.priceMax) : '');
    }
  }

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  function handleDismiss() {
    onClose();
  }

  function handleApply() {
    onApply(draft);
    sheetRef.current?.dismiss();
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

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
  );

  const dateValidation = customDate
    ? validateDateRange(fromText, toText)
    : { message: null, fromInvalid: false, toInvalid: false };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['60%', '90%']}
      enablePanDownToClose
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.header}>
        <AppText variant="title" color={theme.colors.ink}>
          Filtres
        </AppText>
      </BottomSheetView>

      <BottomSheetScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="TYPE">
          <View style={styles.chipRow}>
            <Chip label="Tous" active={draft.kind === undefined} onPress={() => selectKind(undefined)} />
            <Chip label="Événements" active={draft.kind === 'EVENT'} onPress={() => selectKind('EVENT')} />
            <Chip label="Lieux" active={draft.kind === 'PLACE'} onPress={() => selectKind('PLACE')} />
          </View>
        </Section>

        <Section title="DATE">
          <View style={styles.chipRow}>
            <Chip
              label="Aujourd'hui"
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
                  DU
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
                  AU
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

        <Section title="QUARTIERS">
          <View style={styles.chipRow}>
            {(facets.data?.items ?? []).map((option) => (
              <Chip
                key={option.name}
                label={option.name}
                active={(draft.neighborhood ?? []).includes(option.name)}
                onPress={() => toggleNeighborhood(option.name)}
              />
            ))}
          </View>
        </Section>

        <Section title="PRIX">
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

        <Section title="CADRE">
          <View style={styles.chipRow}>
            <Chip label="Intérieur" active={draft.indoor === true} onPress={toggleIndoor} />
            <Chip label="Extérieur" active={draft.outdoor === true} onPress={toggleOutdoor} />
          </View>
        </Section>
      </BottomSheetScrollView>

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
    </BottomSheetModal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="caption" color={theme.colors.smoke}>
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

type FilterTriggerButtonProps = {
  count: number;
  onPress: () => void;
};

export function FilterTriggerButton({ count, onPress }: FilterTriggerButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Filtres"
      style={styles.trigger}
    >
      <Icon name="filter" size={18} color={theme.colors.white} strokeWidth={1.8} />
      <AppText variant="subtitle" color={theme.colors.white}>
        Filtres
      </AppText>
      {count > 0 && (
        <View style={styles.triggerBadge}>
          <AppText variant="caption" color={theme.colors.ink}>
            {count}
          </AppText>
        </View>
      )}
    </Pressable>
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
  trigger: {
    position: 'absolute',
    right: theme.space.s4,
    bottom: theme.space.s5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s2,
    minHeight: 44,
    paddingHorizontal: theme.space.s4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.ink,
    ...theme.shadow.card,
  },
  triggerBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brass,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
