import { Animated, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORY_KEYS, CATEGORY_PRESETS, type CategoryKey } from '@wandr/shared';
import { theme } from '../../../src/theme/tokens';
import { usePressFeedback } from '../../../src/theme/usePressFeedback';
import { AppText } from '../../../src/ui/AppText';
import { CATEGORY_KEY_LABEL } from '../../../src/components/categoryCopy';

function CategoryTile({ categoryKey }: { categoryKey: CategoryKey }) {
  const router = useRouter();
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback();
  const preset = CATEGORY_PRESETS[categoryKey];
  const label = CATEGORY_KEY_LABEL[categoryKey];

  return (
    <Pressable
      onPress={() => router.push(`/explore/${categoryKey}`)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.tileWrapper}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.tile, animatedStyle]}>
        <Image source={{ uri: preset.heroImage }} style={styles.image} contentFit="cover" transition={150} />
        <LinearGradient
          colors={['transparent', 'rgba(30,26,22,0.75)']}
          style={styles.scrim}
          pointerEvents="none"
        />
        <View style={styles.labelWrap}>
          <AppText variant="title" color={theme.colors.white} style={styles.label}>
            {label}
          </AppText>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        data={CATEGORY_KEYS}
        numColumns={2}
        columnWrapperStyle={styles.row}
        keyExtractor={(key) => key}
        renderItem={({ item }) => <CategoryTile categoryKey={item} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <AppText variant="display" color={theme.colors.ink} style={styles.heading}>
            Explorer
          </AppText>
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
  content: {
    padding: theme.space.s4,
    gap: theme.space.s4,
  },
  heading: {
    marginBottom: theme.space.s2,
  },
  row: {
    gap: theme.space.s4,
  },
  tileWrapper: {
    flex: 1,
  },
  tile: {
    aspectRatio: 1,
    borderRadius: theme.radius.card,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface3,
    ...theme.shadow.card,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  labelWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space.s3,
  },
  label: {
    textAlign: 'center',
  },
});
