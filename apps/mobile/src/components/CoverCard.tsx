import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ActivityDTO } from '@wandr/shared';
import { theme } from '../theme/tokens';
import { usePressFeedback } from '../theme/usePressFeedback';
import { AppText } from '../ui/AppText';
import { Badge } from '../ui/Badge';
import { PriceLabel } from '../ui/PriceLabel';
import { formatActivityWhen, formatActivityWhere } from './cardMeta';

type CoverCardProps = {
  activity: ActivityDTO;
  onPress?: () => void;
  actionsSlot?: ReactNode;
};

const WHITE_85 = 'rgba(255,255,255,0.85)';

export function CoverCard({ activity, onPress, actionsSlot }: CoverCardProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={activity.title}
      style={styles.wrapper}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <Image
          source={{ uri: activity.imageUrl ?? undefined }}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />
        <LinearGradient
          colors={['transparent', 'rgba(30,26,22,0.9)']}
          locations={[0.35, 1]}
          style={styles.scrim}
          pointerEvents="none"
        />
        {activity.isFeatured && <Badge variant="trending" label="Tendance" style={styles.badge} />}
        {actionsSlot ? <View style={styles.actions}>{actionsSlot}</View> : null}
        <View style={styles.body}>
          <AppText variant="title" color={theme.colors.white} numberOfLines={2}>
            {activity.title}
          </AppText>
          <View style={styles.metaRow}>
            <AppText variant="caption" color={WHITE_85}>
              {formatActivityWhen(activity)}
            </AppText>
            <View style={styles.dot} />
            <AppText variant="caption" color={WHITE_85}>
              {formatActivityWhere(activity)}
            </AppText>
          </View>
          <PriceLabel activity={activity} color={theme.colors.white} style={styles.price} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  card: {
    aspectRatio: 4 / 3,
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
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  badge: {
    position: 'absolute',
    top: theme.space.s3,
    left: theme.space.s3,
  },
  actions: {
    position: 'absolute',
    top: theme.space.s3,
    right: theme.space.s3,
  },
  body: {
    position: 'absolute',
    left: theme.space.s4,
    right: theme.space.s4,
    bottom: theme.space.s3,
    gap: theme.space.s1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: WHITE_85,
  },
  price: {
    marginTop: theme.space.s1,
  },
});
