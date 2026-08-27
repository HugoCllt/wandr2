import { useCallback, useMemo, useRef, type ReactElement } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { FeedItemDTO } from '@wandr/shared';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import type { UseFeedResult } from '../lib/queries/useFeed';
import { CardActions } from './CardActions';
import { CoverCard } from './CoverCard';
import { buildFeedRows, type FeedRow } from './feedCadence';
import { ImagelessCard } from './ImagelessCard';
import { SpotlightScreenCard } from './SpotlightScreenCard';

const EMPTY_ROWS: FeedRow[] = [];
const SNAP_WINDOW_RATIO = 0.45;

type FeedListProps = {
  query: UseFeedResult;
  columns: 1 | 2;
  ListHeaderComponent?: ReactElement | null;
  emptyLabel?: string;
  bottomInset?: number;
  onResetFilters?: () => void;
  excludeIds?: string[];
};

export function FeedList({
  query,
  columns,
  ListHeaderComponent,
  emptyLabel = 'Rien ici pour l’instant',
  bottomInset = 0,
  onResetFilters,
  excludeIds,
}: FeedListProps) {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const listRef = useRef<FlatList<FeedRow>>(null);
  const spotlightRows = useRef<Map<string, { offset: number; index: number }>>(new Map());
  const { data, isLoading, isError, isFetchingNextPage, isRefetching, hasNextPage, fetchNextPage, refetch } = query;

  const items = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.items) ?? [];
    if (!excludeIds || excludeIds.length === 0) return all;
    const skip = new Set(excludeIds);
    return all.filter((item) => !skip.has(item.id));
  }, [data, excludeIds]);
  const rows = useMemo(() => buildFeedRows(items, columns), [items, columns]);

  const openActivity = useCallback(
    (item: FeedItemDTO) => {
      router.push({
        pathname: '/activity/[slug]',
        params: {
          slug: item.slug,
          favorited: item.isFavorited ? '1' : '0',
          bookmarked: item.isBookmarked ? '1' : '0',
        },
      });
    },
    [router],
  );

  const measureSpotlight = useCallback((key: string, index: number, event: LayoutChangeEvent) => {
    spotlightRows.current.set(key, { offset: event.nativeEvent.layout.y, index });
  }, []);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const window = windowHeight * SNAP_WINDOW_RATIO;
      let bestIndex: number | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      spotlightRows.current.forEach(({ offset, index }) => {
        const distance = Math.abs(y - offset);
        if (distance > window || distance < theme.space.s4 + 4) return;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      if (bestIndex === null) return;
      listRef.current?.scrollToIndex({ index: bestIndex, animated: true, viewPosition: 0 });
    },
    [windowHeight],
  );

  const renderItem = useCallback(
    ({ item: row, index }: { item: FeedRow; index: number }) => {
      if (row.type === 'spotlight') {
        return (
          <View onLayout={(event) => measureSpotlight(row.key, index, event)}>
            <SpotlightScreenCard
              activity={row.item}
              onPress={() => openActivity(row.item)}
              actionsSlot={<CardActions activity={row.item} />}
            />
          </View>
        );
      }
      const fillers = columns - row.items.length;
      return (
        <View style={styles.row}>
          {row.items.map((item) => (
            <View key={item.id} style={styles.cell}>
              {item.imageUrl ? (
                <CoverCard
                  activity={item}
                  onPress={() => openActivity(item)}
                  actionsSlot={<CardActions activity={item} />}
                />
              ) : (
                <ImagelessCard
                  activity={item}
                  onPress={() => openActivity(item)}
                  actionsSlot={<CardActions activity={item} variant="quiet" />}
                />
              )}
            </View>
          ))}
          {fillers > 0
            ? Array.from({ length: fillers }, (_, index) => <View key={`filler-${index}`} style={styles.cell} />)
            : null}
        </View>
      );
    },
    [columns, openActivity, measureSpotlight],
  );

  const keyExtractor = useCallback((row: FeedRow) => row.key, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const placeholder = isLoading ? (
    <View style={styles.skeletonList}>
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
    </View>
  ) : isError ? (
    <View style={styles.center}>
      <AppText variant="body" color={theme.colors.smoke} style={styles.centerText}>
        Une erreur est survenue.
      </AppText>
      <Pressable onPress={() => refetch()} style={styles.retryButton} accessibilityRole="button">
        <AppText variant="subtitle" color={theme.colors.brass700}>
          Réessayer
        </AppText>
      </Pressable>
    </View>
  ) : (
    <View style={styles.center}>
      <AppText variant="body" color={theme.colors.smoke} style={styles.centerText}>
        {emptyLabel}
      </AppText>
      {onResetFilters ? (
        <Pressable onPress={onResetFilters} style={styles.retryButton} accessibilityRole="button">
          <AppText variant="subtitle" color={theme.colors.brass700}>
            Réinitialiser les filtres
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <FlatList
      ref={listRef}
      data={isLoading || isError ? EMPTY_ROWS : rows}
      numColumns={1}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={placeholder}
      ListFooterComponent={
        isFetchingNextPage ? <ActivityIndicator color={theme.colors.brass} style={styles.footer} /> : null
      }
      onMomentumScrollEnd={handleMomentumEnd}
      onScrollToIndexFailed={() => undefined}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      windowSize={7}
      removeClippedSubviews={Platform.OS === 'android'}
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
    flexDirection: 'row',
    gap: theme.space.s4,
  },
  cell: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.space.s8,
    gap: theme.space.s3,
  },
  skeletonList: {
    gap: theme.space.s4,
  },
  skeletonCard: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface3,
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
