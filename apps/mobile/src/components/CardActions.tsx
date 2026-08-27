import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View, type GestureResponderEvent, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  type AnimatedStyle,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { FeedItemDTO } from '@wandr/shared';
import { theme } from '../theme/tokens';
import { motion, useReducedMotion } from '../theme/motion';
import { Icon, type IconName } from '../ui/Icon';
import { ApiError } from '../lib/api';
import { useToggleFavorite } from '../lib/queries/useFavorites';
import { useAddToCalendar, useRemoveBookmark } from '../lib/queries/useCalendar';

type CardActionsProps = {
  activity: FeedItemDTO;
  variant?: 'card' | 'detail' | 'quiet';
  direction?: 'row' | 'column';
};

function notifyActionFailed(error: unknown, message: string) {
  if (error instanceof ApiError && error.status === 401) return;
  Alert.alert('Action impossible', `${message} Vérifiez votre connexion et réessayez.`);
}

export function CardActions({ activity, variant = 'card', direction = 'row' }: CardActionsProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(activity.isFavorited);
  const [favoritedProp, setFavoritedProp] = useState(activity.isFavorited);
  if (activity.isFavorited !== favoritedProp) {
    setFavoritedProp(activity.isFavorited);
    setFavorited(activity.isFavorited);
  }

  const [bookmarked, setBookmarked] = useState(activity.isBookmarked);
  const [bookmarkedProp, setBookmarkedProp] = useState(activity.isBookmarked);
  if (activity.isBookmarked !== bookmarkedProp) {
    setBookmarkedProp(activity.isBookmarked);
    setBookmarked(activity.isBookmarked);
  }

  const toggleFavorite = useToggleFavorite();
  const addToCalendar = useAddToCalendar();
  const removeBookmark = useRemoveBookmark();

  const reduceMotion = useReducedMotion();
  const heartScale = useSharedValue(1);
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  function handleFavoritePress(e: GestureResponderEvent) {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !favorited;
    setFavorited(next);
    if (next && !reduceMotion) {
      heartScale.set(withSequence(withSpring(1.25, motion.spring.pop), withSpring(1, motion.spring.pop)));
    }
    toggleFavorite.mutate(
      { activityId: activity.id, next },
      {
        onError: (error) => {
          setFavorited(!next);
          notifyActionFailed(error, next ? 'Impossible d’ajouter aux favoris.' : 'Impossible de retirer des favoris.');
        },
      },
    );
  }

  function handleBookmarkPress(e: GestureResponderEvent) {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (bookmarked) {
      setBookmarked(false);
      removeBookmark.mutate(activity.id, {
        onError: (error) => {
          setBookmarked(true);
          notifyActionFailed(error, 'Impossible de retirer du calendrier.');
        },
      });
      return;
    }

    if (activity.kind === 'EVENT' && activity.dateStart) {
      setBookmarked(true);
      addToCalendar.mutate(
        { activityId: activity.id, scheduledAt: activity.dateStart },
        {
          onError: (error) => {
            setBookmarked(false);
            notifyActionFailed(error, 'Impossible d’ajouter au calendrier.');
          },
        },
      );
      return;
    }

    router.push({
      pathname: '/calendar-add',
      params: { activityId: activity.id, activityTitle: activity.title },
    });
  }

  return (
    <View style={[styles.group, direction === 'column' && styles.groupColumn]}>
      <ActionButton
        variant={variant}
        icon="heart"
        activeIcon="heart-fill"
        activeColor={theme.colors.heart}
        activeTint={theme.colors.heartTint}
        active={favorited}
        label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        hint={favorited ? 'Retire cette activité de vos favoris.' : 'Ajoute cette activité à vos favoris.'}
        onPress={handleFavoritePress}
        iconAnimatedStyle={heartAnimatedStyle}
      />
      <ActionButton
        variant={variant}
        icon="bookmark"
        activeIcon="bookmark-fill"
        activeColor={theme.colors.brass}
        activeTint={theme.colors.brassTint}
        active={bookmarked}
        label={bookmarked ? 'Retirer du calendrier' : 'Ajouter au calendrier'}
        hint={bookmarked ? 'Retire cette activité de votre calendrier.' : 'Ajoute cette activité à votre calendrier.'}
        onPress={handleBookmarkPress}
      />
    </View>
  );
}

type ActionButtonProps = {
  variant: 'card' | 'detail' | 'quiet';
  icon: IconName;
  activeIcon: IconName;
  activeColor: string;
  activeTint: string;
  active: boolean;
  label: string;
  hint: string;
  onPress: (e: GestureResponderEvent) => void;
  iconAnimatedStyle?: AnimatedStyle<ViewStyle>;
};

function ActionButton({
  variant,
  icon,
  activeIcon,
  activeColor,
  activeTint,
  active,
  label,
  hint,
  onPress,
  iconAnimatedStyle,
}: ActionButtonProps) {
  const isCard = variant === 'card';
  const idleColor = isCard ? theme.colors.white : variant === 'quiet' ? theme.colors.smoke : theme.colors.ink;
  const iconElement = (
    <Icon
      name={active ? activeIcon : icon}
      size={isCard ? 16 : 18}
      color={active ? activeColor : idleColor}
      strokeWidth={1.8}
    />
  );
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ selected: active }}
      hitSlop={6}
      style={[
        variant === 'card' ? styles.cardButton : variant === 'quiet' ? styles.quietButton : styles.detailButton,
        active && isCard && styles.cardButtonActive,
        active && variant === 'detail' && { backgroundColor: activeTint },
      ]}
    >
      {iconAnimatedStyle ? <Animated.View style={iconAnimatedStyle}>{iconElement}</Animated.View> : iconElement}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s3,
  },
  groupColumn: {
    flexDirection: 'column',
    gap: theme.space.s1,
  },
  quietButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButtonActive: {
    backgroundColor: theme.colors.white,
  },
  detailButton: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.btn,
    backgroundColor: theme.colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
