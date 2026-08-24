import { useInfiniteQuery } from '@tanstack/react-query';
import type { CategoryKey, FeedResultDTO, FilterValueDTO } from '@wandr/shared';
import { isDateRange } from '@wandr/shared';
import { apiJson } from '../api';

const FEED_LIMIT = 24;

type UseFeedParams = {
  preset?: CategoryKey;
  filters: FilterValueDTO;
};

function buildFeedParams(
  preset: CategoryKey | undefined,
  filters: FilterValueDTO,
  cursor: string | null,
): URLSearchParams {
  const params = new URLSearchParams();
  if (preset) params.set('preset', preset);
  if (filters.kind !== undefined) params.set('kind', filters.kind);
  if (filters.neighborhood !== undefined) params.set('neighborhood', filters.neighborhood.join(','));
  if (filters.date !== undefined) {
    params.set('date', isDateRange(filters.date) ? `${filters.date.from}..${filters.date.to}` : filters.date);
  }
  if (filters.category !== undefined) params.set('category', filters.category.join(','));
  if (filters.priceMax !== undefined) params.set('priceMax', String(filters.priceMax));
  if (filters.indoor !== undefined) params.set('indoor', String(filters.indoor));
  if (filters.outdoor !== undefined) params.set('outdoor', String(filters.outdoor));
  if (filters.free !== undefined) params.set('free', String(filters.free));
  if (filters.paid !== undefined) params.set('paid', String(filters.paid));
  params.set('limit', String(FEED_LIMIT));
  if (cursor) params.set('cursor', cursor);
  return params;
}

export function useFeed({ preset, filters }: UseFeedParams) {
  return useInfiniteQuery({
    queryKey: ['feed', preset ?? null, filters],
    queryFn: ({ pageParam }) => {
      const params = buildFeedParams(preset, filters, pageParam);
      return apiJson<FeedResultDTO>(`/api/feed?${params.toString()}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60_000,
  });
}

export type UseFeedResult = ReturnType<typeof useFeed>;
