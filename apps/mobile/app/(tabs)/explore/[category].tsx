import { StyleSheet, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { isCategoryKey, type CategoryKey } from '@wandr/shared';
import { theme } from '../../../src/theme/tokens';
import { useFeedColumns } from '../../../src/theme/useFeedColumns';
import { useTabBarClearance } from '../../../src/theme/useTabBarClearance';
import { useFeed } from '../../../src/lib/queries/useFeed';
import { useHeroSlideIds } from '../../../src/lib/queries/useHeroSlides';
import { AppText } from '../../../src/ui/AppText';
import { FeedList } from '../../../src/components/FeedList';
import { HeroCarousel } from '../../../src/components/HeroCarousel';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { CATEGORY_KEY_LABEL } from '../../../src/components/categoryCopy';
import { countActiveFilters, emptyFilters } from '../../../src/lib/filtersState';
import { setScopedFilters, useScopedFilters } from '../../../src/lib/filtersStore';

export default function CategoryRouteScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();

  if (typeof category !== 'string' || !isCategoryKey(category)) {
    return <Redirect href="/explore" />;
  }

  return <CategoryScreen categoryKey={category} />;
}

function CategoryScreen({ categoryKey }: { categoryKey: CategoryKey }) {
  const router = useRouter();
  const { columns } = useFeedColumns();
  const filters = useScopedFilters(categoryKey);
  const query = useFeed({ preset: categoryKey, filters });
  const clearance = useTabBarClearance();
  const activeFilters = countActiveFilters(filters);
  const heroIds = useHeroSlideIds(categoryKey);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <FeedList
        query={query}
        columns={columns}
        emptyLabel="Rien ici pour l’instant"
        bottomInset={clearance}
        excludeIds={heroIds}
        onResetFilters={activeFilters > 0 ? () => setScopedFilters(categoryKey, emptyFilters()) : undefined}
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <HeroCarousel preset={categoryKey} />
            </View>
            <AppText variant="display" color={theme.colors.ink} style={styles.heading}>
              {CATEGORY_KEY_LABEL[categoryKey]}
            </AppText>
          </View>
        }
      />
      <ScreenHeader
        filterCount={activeFilters}
        onPressFilters={() => router.push({ pathname: '/filters', params: { scope: categoryKey } })}
        onPressBack={() => (router.canGoBack() ? router.back() : router.replace('/explore'))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
  },
  hero: {
    marginHorizontal: -theme.space.s4,
    marginTop: -theme.space.s4,
  },
  heading: {
    textAlign: 'center',
    marginTop: theme.space.s5,
    marginBottom: theme.space.s1,
  },
});
