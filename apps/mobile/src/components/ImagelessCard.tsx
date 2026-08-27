import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { ActivityDTO } from '@wandr/shared';
import { theme } from '../theme/tokens';
import { usePressFeedback } from '../theme/usePressFeedback';
import { AppText } from '../ui/AppText';
import { Icon } from '../ui/Icon';
import { PriceLabel } from '../ui/PriceLabel';
import { categoryIconFor, categoryLabelFor, formatActivityWhen, formatActivityWhere } from './cardMeta';

type ImagelessCardProps = {
  activity: ActivityDTO;
  onPress?: () => void;
  actionsSlot?: ReactNode;
};

export function ImagelessCard({ activity, onPress, actionsSlot }: ImagelessCardProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback();
  const primary = activity.categories.primary;

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
        <View style={styles.topRow}>
          <AppText variant="caption" color={theme.colors.smoke}>
            {categoryLabelFor(primary)}
          </AppText>
          <View style={styles.topRowRight}>
            {actionsSlot}
            <View style={styles.iconMark}>
              <Icon name={categoryIconFor(primary)} size={18} color={theme.colors.brass} strokeWidth={1.6} />
            </View>
          </View>
        </View>
        <AppText variant="title" color={theme.colors.ink} numberOfLines={3} style={styles.title}>
          {activity.title}
        </AppText>
        <View style={styles.metaRow}>
          <AppText variant="caption" color={theme.colors.smoke} numberOfLines={1}>
            {formatActivityWhen(activity)}
          </AppText>
          <View style={styles.dot} />
          <AppText variant="caption" color={theme.colors.smoke} numberOfLines={1} style={styles.metaWhere}>
            {formatActivityWhere(activity)}
          </AppText>
        </View>
        <PriceLabel activity={activity} color={theme.colors.brass700} style={styles.price} />
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
    borderWidth: theme.hairline,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    padding: theme.space.s4,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s2,
  },
  iconMark: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brassTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: theme.space.s2,
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
    backgroundColor: theme.colors.smoke,
  },
  price: {
    marginTop: theme.space.s1,
  },
});
