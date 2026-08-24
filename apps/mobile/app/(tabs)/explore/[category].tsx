import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { isCategoryKey, type CategoryKey } from '@wandr/shared';
import { theme } from '../../../src/theme/tokens';
import { useFeedColumns } from '../../../src/theme/useFeedColumns';
import { useFeed } from '../../../src/lib/queries/useFeed';
import { AppText } from '../../../src/ui/AppText';
import { FeedList } from '../../../src/components/FeedList';
import { CATEGORY_KEY_EYEBROW, CATEGORY_KEY_LABEL } from '../../../src/components/categoryCopy';

const CITY_NAME = 'Montréal';

export default function CategoryRouteScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();

  if (typeof category !== 'string' || !isCategoryKey(category)) {
    return <Redirect href="/explore" />;
  }

  return <CategoryScreen categoryKey={category} />;
}

function CategoryScreen({ categoryKey }: { categoryKey: CategoryKey }) {
  const { columns } = useFeedColumns();
  const query = useFeed({ preset: categoryKey, filters: {} });
  const eyebrow = CATEGORY_KEY_EYEBROW[categoryKey].replace('{city}', CITY_NAME.toUpperCase());

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FeedList
        query={query}
        columns={columns}
        emptyLabel="Rien ici pour l'instant"
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="caption" color={theme.colors.smoke} style={styles.eyebrow}>
              {eyebrow}
            </AppText>
            <AppText variant="display" color={theme.colors.ink}>
              {CATEGORY_KEY_LABEL[categoryKey]}
            </AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
  },
  header: {
    gap: theme.space.s1,
    paddingBottom: theme.space.s2,
  },
  eyebrow: {
    letterSpacing: 1.2,
  },
});
