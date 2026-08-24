import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../src/theme/tokens';
import { useFeedColumns } from '../../src/theme/useFeedColumns';
import { useFeed } from '../../src/lib/queries/useFeed';
import { AppText } from '../../src/ui/AppText';
import { HeroCarousel } from '../../src/components/HeroCarousel';
import { SectionHeader } from '../../src/components/SectionHeader';
import { FeedList } from '../../src/components/FeedList';

export default function AccueilScreen() {
  const { columns } = useFeedColumns();
  const query = useFeed({ filters: {} });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FeedList
        query={query}
        columns={columns}
        emptyLabel="Rien ici pour l'instant"
        ListHeaderComponent={
          <View>
            <AppText variant="caption" color={theme.colors.smoke} style={styles.eyebrow}>
              CE WEEK-END À MONTRÉAL
            </AppText>
            <View style={styles.hero}>
              <HeroCarousel />
            </View>
            <SectionHeader title="Pour toi" />
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
  eyebrow: {
    letterSpacing: 1.2,
  },
  hero: {
    marginHorizontal: -theme.space.s4,
    marginTop: theme.space.s3,
  },
});
