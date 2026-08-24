import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme/tokens';
import { useFeedColumns } from '../src/theme/useFeedColumns';
import { useFavoritesFeed } from '../src/lib/queries/useFavorites';
import { AppText } from '../src/ui/AppText';
import { Icon } from '../src/ui/Icon';
import { FeedList } from '../src/components/FeedList';

export default function FavoritesScreen() {
  const router = useRouter();
  const { columns } = useFeedColumns();
  const query = useFavoritesFeed();

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          style={styles.backButton}
        >
          <View style={styles.backIcon}>
            <Icon name="arrow" size={16} color={theme.colors.ink} />
          </View>
        </Pressable>
        <AppText variant="title" color={theme.colors.ink} style={styles.headerTitle}>
          Favoris
        </AppText>
        <View style={styles.headerSpacer} />
      </View>
      <FeedList query={query} columns={columns} emptyLabel="Aucun favori pour l'instant" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space.s3,
    paddingVertical: theme.space.s2,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  headerSpacer: {
    width: 44,
  },
});
