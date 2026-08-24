import { memo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { ActivityDTO } from '@wandr/shared';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import { apiJson } from '../lib/api';

const FEATURED_LIMIT = 3;
const SLIDE_ASPECT_RATIO = 16 / 10;

type HeroSlideProps = {
  activity: ActivityDTO;
  width: number;
  onPress: () => void;
};

const HeroSlide = memo(function HeroSlide({ activity, width, onPress }: HeroSlideProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width }}
      accessibilityRole="button"
      accessibilityLabel={activity.title}
    >
      <View style={[styles.slide, { height: width / SLIDE_ASPECT_RATIO }]}>
        <Image
          source={{ uri: activity.imageUrl ?? undefined }}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />
        <LinearGradient
          colors={['transparent', 'rgba(30,26,22,0.9)']}
          locations={[0.3, 1]}
          style={styles.scrim}
          pointerEvents="none"
        />
        <View style={styles.body}>
          <AppText variant="caption" color={theme.colors.brass} style={styles.eyebrow}>
            À LA UNE
          </AppText>
          <AppText variant="display" color={theme.colors.white} numberOfLines={2}>
            {activity.title}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
});

export function HeroCarousel() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ['activities-featured', FEATURED_LIMIT],
    queryFn: () => apiJson<ActivityDTO[]>(`/api/activities/featured?limit=${FEATURED_LIMIT}`),
    staleTime: 60_000,
  });

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / width);
      setActiveIndex((prev) => (prev === index ? prev : index));
    },
    [width],
  );

  const keyExtractor = useCallback((item: ActivityDTO) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: ActivityDTO }) => (
      <HeroSlide activity={item} width={width} onPress={() => router.push(`/activity/${item.slug}`)} />
    ),
    [width, router],
  );

  if (isLoading) {
    return (
      <View style={[styles.slide, { width, height: width / SLIDE_ASPECT_RATIO }]}>
        <ActivityIndicator color={theme.colors.brass} />
      </View>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <View>
      <FlatList
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={renderItem}
      />
      {data.length > 1 && (
        <View style={styles.dots}>
          {data.map((item, i) => (
            <View key={item.id} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    backgroundColor: theme.colors.surface3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
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
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
  },
  body: {
    position: 'absolute',
    left: theme.space.s4,
    right: theme.space.s4,
    bottom: theme.space.s5,
    gap: theme.space.s1,
  },
  eyebrow: {
    letterSpacing: 1.2,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.space.s2,
    paddingVertical: theme.space.s3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.silver,
  },
  dotActive: {
    width: 20,
    backgroundColor: theme.colors.brass,
  },
});
