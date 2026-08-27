import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../src/theme/tokens';
import { useFeedColumns } from '../../src/theme/useFeedColumns';
import { useTabBarClearance } from '../../src/theme/useTabBarClearance';
import { useFeed } from '../../src/lib/queries/useFeed';
import { useHeroSlideIds } from '../../src/lib/queries/useHeroSlides';
import { HeroCarousel } from '../../src/components/HeroCarousel';
import { FeedList } from '../../src/components/FeedList';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { countActiveFilters, emptyFilters } from '../../src/lib/filtersState';
import { setScopedFilters, useScopedFilters } from '../../src/lib/filtersStore';

export default function AccueilScreen() {
  const router = useRouter();
  const { columns } = useFeedColumns();
  const filters = useScopedFilters('home');
  const query = useFeed({ filters });
  const clearance = useTabBarClearance();
  const activeFilters = countActiveFilters(filters);
  const heroIds = useHeroSlideIds();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <FeedList
        query={query}
        columns={columns}
        emptyLabel="Rien ici pour l’instant"
        bottomInset={clearance}
        excludeIds={heroIds}
        onResetFilters={activeFilters > 0 ? () => setScopedFilters('home', emptyFilters()) : undefined}
        ListHeaderComponent={
          <View style={styles.hero}>
            <HeroCarousel />
          </View>
        }
      />
      <ScreenHeader
        filterCount={activeFilters}
        onPressFilters={() => router.push({ pathname: '/filters', params: { scope: 'home' } })}
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
    marginBottom: theme.space.s2,
  },
});
