import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FilterValueDTO } from '@wandr/shared';
import { theme } from '../../src/theme/tokens';
import { useFeedColumns } from '../../src/theme/useFeedColumns';
import { useFeed } from '../../src/lib/queries/useFeed';
import { AppText } from '../../src/ui/AppText';
import { HeroCarousel } from '../../src/components/HeroCarousel';
import { SectionHeader } from '../../src/components/SectionHeader';
import { FeedList } from '../../src/components/FeedList';
import { FilterSheet, FilterTriggerButton, FILTER_TRIGGER_CLEARANCE } from '../../src/components/FilterSheet';
import { countActiveFilters, emptyFilters } from '../../src/lib/filtersState';

export default function AccueilScreen() {
  const { columns } = useFeedColumns();
  const [filters, setFilters] = useState<FilterValueDTO>(emptyFilters());
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const query = useFeed({ filters });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FeedList
        query={query}
        columns={columns}
        emptyLabel="Rien ici pour l’instant"
        bottomInset={FILTER_TRIGGER_CLEARANCE}
        ListHeaderComponent={
          <View>
            <AppText variant="eyebrow" color={theme.colors.smoke}>
              CE WEEK-END À MONTRÉAL
            </AppText>
            <View style={styles.hero}>
              <HeroCarousel />
            </View>
            <SectionHeader title="Pour toi" />
          </View>
        }
      />
      <FilterTriggerButton count={countActiveFilters(filters)} onPress={() => setFilterSheetOpen(true)} />
      <FilterSheet
        visible={filterSheetOpen}
        value={filters}
        onApply={setFilters}
        onClose={() => setFilterSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
  },
  hero: {
    marginHorizontal: -theme.space.s4,
    marginTop: theme.space.s3,
  },
});
