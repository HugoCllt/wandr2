import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { FeedItemDTO } from '@wandr/shared';
import { theme } from '../theme/tokens';
import { Icon, type IconName } from '../ui/Icon';
import { useToggleFavorite } from '../lib/queries/useFavorites';
import { useAddToCalendar, useRemoveBookmark } from '../lib/queries/useCalendar';
import { AddToCalendarSheet } from './AddToCalendarSheet';

type CardActionsProps = {
  activity: FeedItemDTO;
  variant?: 'card' | 'detail';
};

function notifyActionFailed(message: string) {
  Alert.alert('Action impossible', `${message} Vérifiez votre connexion et réessayez.`);
}

export function CardActions({ activity, variant = 'card' }: CardActionsProps) {
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

  const [sheetOpen, setSheetOpen] = useState(false);

  const toggleFavorite = useToggleFavorite();
  const addToCalendar = useAddToCalendar();
  const removeBookmark = useRemoveBookmark();

  function handleFavoritePress(e: GestureResponderEvent) {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !favorited;
    setFavorited(next);
    toggleFavorite.mutate(
      { activityId: activity.id, next },
      {
        onError: () => {
          setFavorited(!next);
          notifyActionFailed(next ? 'Impossible d’ajouter aux favoris.' : 'Impossible de retirer des favoris.');
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
        onError: () => {
          setBookmarked(true);
          notifyActionFailed('Impossible de retirer du calendrier.');
        },
      });
      return;
    }

    if (activity.kind === 'EVENT' && activity.dateStart) {
      setBookmarked(true);
      addToCalendar.mutate(
        { activityId: activity.id, scheduledAt: activity.dateStart },
        {
          onError: () => {
            setBookmarked(false);
            notifyActionFailed('Impossible d’ajouter au calendrier.');
          },
        },
      );
      return;
    }

    setSheetOpen(true);
  }

  return (
    <>
      <View style={variant === 'card' ? styles.cardRow : styles.detailRow}>
        <ActionButton
          variant={variant}
          icon="heart"
          active={favorited}
          label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          onPress={handleFavoritePress}
        />
        <ActionButton
          variant={variant}
          icon="bookmark"
          active={bookmarked}
          label={bookmarked ? 'Retirer du calendrier' : 'Ajouter au calendrier'}
          onPress={handleBookmarkPress}
        />
      </View>
      <AddToCalendarSheet
        activityId={activity.id}
        activityTitle={activity.title}
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={() => setBookmarked(true)}
      />
    </>
  );
}

type ActionButtonProps = {
  variant: 'card' | 'detail';
  icon: IconName;
  active: boolean;
  label: string;
  onPress: (e: GestureResponderEvent) => void;
};

function ActionButton({ variant, icon, active, label, onPress }: ActionButtonProps) {
  const isCard = variant === 'card';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      hitSlop={8}
      style={[
        isCard ? styles.cardButton : styles.detailButton,
        active && (isCard ? styles.cardButtonActive : styles.detailButtonActive),
      ]}
    >
      <Icon
        name={icon}
        size={isCard ? 16 : 18}
        color={isCard ? theme.colors.white : active ? theme.colors.brass : theme.colors.ink}
        strokeWidth={1.8}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardRow: {
    flexDirection: 'row',
    gap: theme.space.s2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s2,
  },
  cardButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButtonActive: {
    backgroundColor: theme.colors.brass,
  },
  detailButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.btn,
    backgroundColor: theme.colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailButtonActive: {
    backgroundColor: theme.colors.brassTint,
  },
});
