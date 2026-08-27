import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { isCategoryKey } from '@wandr/shared';
import { theme } from '../src/theme/tokens';
import { FilterSheetBody } from '../src/components/FilterSheet';
import { getScopedFilters, setScopedFilters, type FilterScope } from '../src/lib/filtersStore';

export default function FiltersScreen() {
  const router = useRouter();
  const { scope } = useLocalSearchParams<{ scope?: string }>();
  const filterScope: FilterScope = typeof scope === 'string' && isCategoryKey(scope) ? scope : 'home';

  return (
    <View style={styles.screen}>
      <FilterSheetBody
        value={getScopedFilters(filterScope)}
        onApply={(next) => setScopedFilters(filterScope, next)}
        onClose={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.surface2,
  },
});
