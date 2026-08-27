import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useRouter } from 'expo-router';
import type { ActivityDTO, CategoryKey } from '@wandr/shared';
import { theme } from '../theme/tokens';
import { motion, useReducedMotion } from '../theme/motion';
import { AppText } from '../ui/AppText';
import { useHeroSlides } from '../lib/queries/useHeroSlides';

const SLIDE_ASPECT_RATIO = 4 / 5;
const AUTOPLAY_INTERVAL_MS = 3000;
const AUTOPLAY_RESUME_DELAY_MS = 4000;

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
          colors={['transparent', theme.colors.scrim900]}
          locations={[0.3, 1]}
          style={styles.scrim}
          pointerEvents="none"
        />
        <View style={styles.body}>
          <AppText variant="display" color={theme.colors.white} numberOfLines={2}>
            {activity.title}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
});

type DotProps = {
  index: number;
  progress: ReturnType<typeof useSharedValue<number>>;
};

function Dot({ index, progress }: DotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const active = Math.round(progress.value) === index;
    return {
      width: withTiming(active ? 20 : 6, { duration: motion.duration.state, easing: motion.easing.inOut }),
      backgroundColor: withTiming(active ? theme.colors.white : theme.colors.white85, {
        duration: motion.duration.state,
        easing: motion.easing.inOut,
      }),
    };
  });
  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export type HeroCarouselProps = {
  preset?: CategoryKey;
};

export function HeroCarousel({ preset }: HeroCarouselProps) {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const listRef = useRef<Animated.FlatList<ActivityDTO>>(null);
  const activeIndexRef = useRef(0);
  const autoScrollingRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollProgress = useSharedValue(0);

  const { data, isLoading } = useHeroSlides(preset);

  const slideCount = data?.length ?? 0;

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current === null) return;
    clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = null;
  }, []);

  const scheduleResume = useCallback(() => {
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null;
      setAutoplayPaused(false);
    }, AUTOPLAY_RESUME_DELAY_MS);
  }, [clearResumeTimer]);

  useEffect(() => {
    if (activeIndexRef.current < slideCount) return;
    activeIndexRef.current = 0;
    scrollProgress.value = 0;
  }, [slideCount, scrollProgress]);

  useEffect(() => {
    if (!isFocused || reduceMotion || autoplayPaused || slideCount < 2) return;
    const timer = setInterval(() => {
      const next = (activeIndexRef.current + 1) % slideCount;
      activeIndexRef.current = next;
      autoScrollingRef.current = true;
      listRef.current?.scrollToIndex({ index: next, animated: true });
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isFocused, reduceMotion, autoplayPaused, slideCount]);

  useEffect(() => {
    return () => clearResumeTimer();
  }, [clearResumeTimer]);

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollProgress.set(event.contentOffset.x / width);
    },
  });

  const handleScrollBeginDrag = useCallback(() => {
    autoScrollingRef.current = false;
    clearResumeTimer();
    setAutoplayPaused(true);
  }, [clearResumeTimer]);

  const handleScrollEndDrag = useCallback(() => {
    scheduleResume();
  }, [scheduleResume]);

  const handleMomentumScrollBegin = useCallback(() => {
    if (autoScrollingRef.current) return;
    clearResumeTimer();
  }, [clearResumeTimer]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      activeIndexRef.current = Math.round(event.nativeEvent.contentOffset.x / width);
      if (autoScrollingRef.current) {
        autoScrollingRef.current = false;
        return;
      }
      scheduleResume();
    },
    [width, scheduleResume],
  );

  const keyExtractor = useCallback((item: ActivityDTO) => item.id, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<ActivityDTO> | null | undefined, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

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
      <Animated.FlatList
        ref={listRef}
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        renderItem={renderItem}
      />
      {data.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {data.map((item, i) => (
            <Dot key={item.id} index={i} progress={scrollProgress} />
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
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: theme.space.s3,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.space.s2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white85,
  },
});
