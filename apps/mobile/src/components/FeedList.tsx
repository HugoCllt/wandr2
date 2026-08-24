import { useCallback, useMemo, type ReactElement } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { FeedItemDTO } from '@wandr/shared';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import type { UseFeedResult } from '../lib/queries/useFeed';
import { CardActions } from './CardActions';
import { CoverCard } from './CoverCard';
import { ImagelessCard } from './ImagelessCard';

type FeedListProps = {
  query: UseFeedResult;
  columns: 1 | 2;
  ListHeaderComponent?: ReactElement | null;
  emptyLabel?: string;
  bottomInset?: number;
};

export function FeedList({
  query,
  columns,
  ListHeaderComponent,
  emptyLabel = "Rien ici pour l'instant",
  bottomInset = 0,
}: FeedListProps) {
  const router = useRouter();
  const { data, isLoading, isError, isFetchingNextPage, isRefetching, hasNextPage, fetchNextPage, refetch } = query;

  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const renderItem = useCallback(
    ({ item }: { item: FeedItemDTO }) => {
      const onPress = () =>
        router.push({
          pathname: '/activity/[slug]',
          params: {
            slug: item.slug,
            favorited: item.isFavorited ? '1' : '0',
            bookmarked: item.isBookmarked ? '1' : '0',
          },
        });
      const actionsSlot = <CardActions activity={item} />;
      return item.imageUrl ? (
        <CoverCard activity={item} onPress={onPress} actionsSlot={actionsSlot} />
      ) : (
        <ImagelessCard activity={item} onPress={onPress} actionsSlot={actionsSlot} />
      );
    },
    [router],
  );

  const keyExtractor = useCallback((item: FeedItemDTO) => item.id, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.brass} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <AppText variant="body" color={theme.colors.smoke} style={styles.centerText}>
          Une erreur est survenue.
        </AppText>
        <Pressable onPress={() => refetch()} style={styles.retryButton} accessibilityRole="button">
          <AppText variant="subtitle" color={theme.colors.brass}>
            Réessayer
          </AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      key={columns}
      data={items}
      numColumns={columns}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <View style={styles.center}>
          <AppText variant="body" color={theme.colors.smoke}>
            {emptyLabel}
          </AppText>
        </View>
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator color={theme.colors.brass} style={styles.footer} />
        ) : null
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={refetch}
          tintColor={theme.colors.brass}
          colors={[theme.colors.brass]}
        />
      }
      contentContainerStyle={[styles.content, bottomInset > 0 && { paddingBottom: theme.space.s4 + bottomInset }]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.s4,
    paddingTop: theme.space.s4,
    paddingBottom: theme.space.s4,
    gap: theme.space.s4,
    flexGrow: 1,
  },
  row: {
    gap: theme.space.s4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.space.s8,
    gap: theme.space.s3,
  },
  centerText: {
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: theme.space.s5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingVertical: theme.space.s5,
  },
});
