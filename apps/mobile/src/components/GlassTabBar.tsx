import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { usePathname, useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { motion, useReducedMotion } from '../theme/motion';
import { theme } from '../theme/tokens';
import { TAB_BAR_GAP, TAB_BAR_HEIGHT } from '../theme/useTabBarClearance';
import { AppText } from '../ui/AppText';
import { GlassSurface, LIQUID_GLASS } from '../ui/GlassSurface';
import { Icon, type IconName } from '../ui/Icon';

type TabSlot = {
  name: string;
  label: string;
  icon: IconName;
  weight: number;
  iconSize: number;
};

const TABS: TabSlot[] = [
  { name: 'explore', label: 'Explorer', icon: 'compass', weight: 1, iconSize: 22 },
  { name: 'calendar', label: 'Calendrier', icon: 'calendar', weight: 1, iconSize: 22 },
  { name: 'index', label: 'Accueil', icon: 'home', weight: 1.35, iconSize: 28 },
  { name: 'chat', label: 'Chat', icon: 'chat', weight: 1, iconSize: 22 },
  { name: 'profile', label: 'Profil', icon: 'profile', weight: 1, iconSize: 22 },
];

const TOTAL_WEIGHT = TABS.reduce((sum, slot) => sum + slot.weight, 0);

type SlotButtonProps = {
  slot: TabSlot;
  focused: boolean;
  onPress: () => void;
};

function SlotButton({ slot, focused, onPress }: SlotButtonProps) {
  const color = focused ? theme.colors.ink : theme.colors.smoke;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={slot.label}
      accessibilityState={{ selected: focused }}
      style={[styles.slot, { flexGrow: slot.weight, flexShrink: slot.weight, flexBasis: 0 }]}
    >
      <Icon name={slot.icon} size={slot.iconSize} color={color} strokeWidth={1.7} />
      <AppText variant="tabLabel" color={color} numberOfLines={1} style={styles.label}>
        {slot.label}
      </AppText>
    </Pressable>
  );
}

export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const focusedName = state.routes[state.index]?.name;
  const activeIndex = TABS.findIndex((slot) => slot.name === focusedName);

  const [rowWidth, setRowWidth] = useState(0);
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);
  const hasMeasured = useRef(false);

  const metrics = useMemo(() => {
    const contentWidth = rowWidth ? rowWidth - theme.space.s2 * 2 : 0;
    const unit = contentWidth / TOTAL_WEIGHT;
    let offset = 0;
    return TABS.map((slot) => {
      const start = offset;
      offset += slot.weight * unit;
      return { x: theme.space.s2 + start + theme.space.s2 / 2, width: slot.weight * unit - theme.space.s2 };
    });
  }, [rowWidth]);

  useEffect(() => {
    if (rowWidth === 0 || activeIndex < 0) return;
    const target = metrics[activeIndex];
    if (!hasMeasured.current) {
      hasMeasured.current = true;
      indicatorX.set(target.x);
      indicatorWidth.set(target.width);
      indicatorOpacity.set(withTiming(1, { duration: motion.duration.state }));
      return;
    }
    if (reducedMotion) {
      indicatorOpacity.set(
        withSequence(
          withTiming(0, { duration: motion.duration.feedback }),
          withTiming(1, { duration: motion.duration.state }),
        ),
      );
      indicatorX.set(withDelay(motion.duration.feedback, withTiming(target.x, { duration: 0 })));
      indicatorWidth.set(withDelay(motion.duration.feedback, withTiming(target.width, { duration: 0 })));
    } else {
      indicatorX.set(withSpring(target.x, motion.spring.slide));
      indicatorWidth.set(withSpring(target.width, motion.spring.slide));
    }
  }, [rowWidth, activeIndex, metrics, reducedMotion, indicatorX, indicatorWidth, indicatorOpacity]);

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    width: indicatorWidth.value,
    transform: [{ translateX: indicatorX.value }],
    opacity: indicatorOpacity.value,
  }));

  function pressSlot(name: string) {
    const route = state.routes.find((item) => item.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (event.defaultPrevented) return;
    if (name !== focusedName) Haptics.selectionAsync();
    if (name === 'explore' && pathname.startsWith('/explore/')) {
      router.replace('/explore');
      return;
    }
    navigation.navigate(route.name);
  }

  return (
    <View style={[styles.bar, !LIQUID_GLASS && styles.barShadow, { bottom: insets.bottom + TAB_BAR_GAP }]}>
      <GlassSurface radius={theme.radius.pill} style={styles.surface}>
        <View
          style={styles.row}
          accessibilityRole="tablist"
          onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
        >
          <Animated.View pointerEvents="none" style={[styles.indicator, indicatorAnimatedStyle]} />
          {TABS.map((slot, index) => (
            <SlotButton
              key={slot.name}
              slot={slot}
              focused={index === activeIndex}
              onPress={() => pressSlot(slot.name)}
            />
          ))}
        </View>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: theme.space.s3,
    right: theme.space.s3,
    height: TAB_BAR_HEIGHT,
    borderRadius: theme.radius.pill,
  },
  barShadow: {
    backgroundColor: theme.colors.glassFallback,
    ...theme.shadow.raised,
  },
  surface: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space.s2,
  },
  indicator: {
    position: 'absolute',
    top: theme.space.s2,
    bottom: theme.space.s2,
    left: 0,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brassTint,
  },
  slot: {
    minHeight: 44,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.s0,
  },
  label: {
    textAlign: 'center',
  },
});
