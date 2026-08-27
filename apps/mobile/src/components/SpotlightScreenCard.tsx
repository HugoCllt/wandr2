import type { ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FeedItemDTO } from '@wandr/shared';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import { Icon } from '../ui/Icon';
import { PriceLabel } from '../ui/PriceLabel';
import { formatActivityWhen, formatActivityWhere } from './cardMeta';
import { useTabBarClearance } from '../theme/useTabBarClearance';

type SpotlightScreenCardProps = {
  activity: FeedItemDTO;
  onPress?: () => void;
  actionsSlot?: ReactNode;
};

export function SpotlightScreenCard({ activity, onPress, actionsSlot }: SpotlightScreenCardProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const clearance = useTabBarClearance();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={activity.title}
      style={[styles.wrapper, { height }]}
    >
      {activity.imageUrl ? (
        <Image source={{ uri: activity.imageUrl }} style={styles.image} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}
      <LinearGradient
        colors={['transparent', theme.colors.scrim900]}
        locations={[0.4, 1]}
        style={styles.scrim}
        pointerEvents="none"
      />
      {actionsSlot ? (
        <View style={[styles.actions, { top: insets.top + theme.space.s4 }]}>{actionsSlot}</View>
      ) : null}
      <View style={[styles.body, { bottom: clearance }]}>
        <AppText variant="display" color={theme.colors.white} numberOfLines={3}>
          {activity.title}
        </AppText>
        {activity.description ? (
          <AppText variant="body" color={theme.colors.white85} numberOfLines={3}>
            {activity.description}
          </AppText>
        ) : null}
        <View style={styles.metaRow}>
          <AppText variant="caption" color={theme.colors.white85} numberOfLines={1}>
            {formatActivityWhen(activity)}
          </AppText>
          <View style={styles.dot} />
          <AppText variant="caption" color={theme.colors.white85} numberOfLines={1} style={styles.metaWhere}>
            {formatActivityWhere(activity)}
          </AppText>
        </View>
        <PriceLabel activity={activity} color={theme.colors.white} />
        <View style={styles.cta}>
          <AppText variant="subtitle" color={theme.colors.white}>
            Découvrir
          </AppText>
          <Icon name="arrow" size={18} color={theme.colors.brass} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: -theme.space.s4,
    backgroundColor: theme.colors.ink,
    overflow: 'hidden',
  },
  imageFallback: {
    backgroundColor: theme.colors.surface3,
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
    height: '60%',
  },
  actions: {
    position: 'absolute',
    right: theme.space.s4,
  },
  body: {
    position: 'absolute',
    left: theme.space.s4,
    right: theme.space.s4,
    gap: theme.space.s2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s2,
  },
  metaWhere: {
    flexShrink: 1,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white85,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s2,
    minHeight: 44,
  },
});
