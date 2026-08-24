import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { FeedResultDTO } from '@wandr/shared';
import { apiJson } from '../api';

const FAVORITES_LIMIT = 24;

export type FeedPages = InfiniteData<FeedResultDTO, string | null>;

export function useFavoritesFeed() {
  return useInfiniteQuery({
    queryKey: ['favorites'],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set('limit', String(FAVORITES_LIMIT));
      if (pageParam) params.set('cursor', pageParam);
      return apiJson<FeedResultDTO>(`/api/favorites/feed?${params.toString()}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60_000,
  });
}

type ToggleFavoriteVars = {
  activityId: string;
  next: boolean;
};

function flipFavorited(page: FeedResultDTO, activityId: string, value: boolean): FeedResultDTO {
  return {
    ...page,
    items: page.items.map((item) => (item.id === activityId ? { ...item, isFavorited: value } : item)),
  };
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId }: ToggleFavoriteVars) =>
      apiJson<{ isFavorited: boolean }>('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId }),
      }),
    onMutate: async ({ activityId, next }: ToggleFavoriteVars) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['feed'] }),
        queryClient.cancelQueries({ queryKey: ['favorites'] }),
      ]);

      const previous = [
        ...queryClient.getQueriesData<FeedPages>({ queryKey: ['feed'] }),
        ...queryClient.getQueriesData<FeedPages>({ queryKey: ['favorites'] }),
      ];

      const flip = (data: FeedPages | undefined): FeedPages | undefined =>
        data ? { ...data, pages: data.pages.map((page) => flipFavorited(page, activityId, next)) } : data;

      queryClient.setQueriesData<FeedPages>({ queryKey: ['feed'] }, flip);
      queryClient.setQueriesData<FeedPages>({ queryKey: ['favorites'] }, flip);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
