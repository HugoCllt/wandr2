import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActivityDetailDTO, CalendarEntryDTO, FeedResultDTO } from '@wandr/shared';
import { apiJson, ApiError } from '../api';
import type { FeedPages } from './useFavorites';

const PENDING_REVIEWS_WINDOW_DAYS = 90;
const PENDING_REVIEWS_LIMIT = 8;
const UPCOMING_WINDOW_DAYS = 60;

function fetchEntries(from: string, to: string): Promise<CalendarEntryDTO[]> {
  return apiJson<CalendarEntryDTO[]>(
    `/api/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
}

function isoDaysFromNow(days: number, from: Date): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function useCalendarEntries(from: string, to: string) {
  return useQuery({
    queryKey: ['calendar', from, to],
    queryFn: () => fetchEntries(from, to),
    staleTime: 60_000,
  });
}

export function useUpcomingEntries() {
  const [now] = useState(() => new Date());
  const from = now.toISOString();
  const to = isoDaysFromNow(UPCOMING_WINDOW_DAYS, now);

  return useQuery({
    queryKey: ['calendar', 'upcoming', from, to],
    queryFn: () => fetchEntries(from, to),
    staleTime: 60_000,
  });
}

function flipBookmarked(page: FeedResultDTO, activityId: string, value: boolean): FeedResultDTO {
  return {
    ...page,
    items: page.items.map((item) => (item.id === activityId ? { ...item, isBookmarked: value } : item)),
  };
}

type BookmarkSnapshot = {
  feeds: [readonly unknown[], FeedPages | undefined][];
  details: [readonly unknown[], ActivityDetailDTO | undefined][];
};

function useBookmarkCachePatch() {
  const queryClient = useQueryClient();

  return {
    snapshot: async (): Promise<BookmarkSnapshot> => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['feed'] }),
        queryClient.cancelQueries({ queryKey: ['favorites'] }),
        queryClient.cancelQueries({ queryKey: ['activity'] }),
      ]);
      return {
        feeds: [
          ...queryClient.getQueriesData<FeedPages>({ queryKey: ['feed'] }),
          ...queryClient.getQueriesData<FeedPages>({ queryKey: ['favorites'] }),
        ],
        details: queryClient.getQueriesData<ActivityDetailDTO>({ queryKey: ['activity'] }),
      };
    },
    apply: (activityId: string, value: boolean) => {
      const flip = (data: FeedPages | undefined): FeedPages | undefined =>
        data ? { ...data, pages: data.pages.map((page) => flipBookmarked(page, activityId, value)) } : data;
      queryClient.setQueriesData<FeedPages>({ queryKey: ['feed'] }, flip);
      queryClient.setQueriesData<FeedPages>({ queryKey: ['favorites'] }, flip);
      queryClient.setQueriesData<ActivityDetailDTO>({ queryKey: ['activity'] }, (data) =>
        data && data.id === activityId ? { ...data, isBookmarked: value } : data,
      );
    },
    restore: (previous: BookmarkSnapshot) => {
      previous.feeds.forEach(([key, data]) => queryClient.setQueryData(key, data));
      previous.details.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-pending'] });
    },
  };
}

type AddToCalendarVars = {
  activityId: string;
  scheduledAt: string;
  notes?: string | null;
};

export function useAddToCalendar() {
  const patch = useBookmarkCachePatch();

  return useMutation({
    mutationFn: async ({ activityId, scheduledAt, notes }: AddToCalendarVars) => {
      try {
        return await apiJson<CalendarEntryDTO>('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activityId, scheduledAt, notes: notes ?? null }),
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) return null;
        throw err;
      }
    },
    onMutate: async ({ activityId }: AddToCalendarVars) => {
      const previous = await patch.snapshot();
      patch.apply(activityId, true);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous && patch.restore(context.previous);
    },
    onSettled: () => patch.invalidateAll(),
  });
}

export function useRemoveBookmark() {
  const patch = useBookmarkCachePatch();

  return useMutation({
    mutationFn: (activityId: string) =>
      apiJson<{ removed: boolean }>(`/api/calendar?activityId=${encodeURIComponent(activityId)}`, {
        method: 'DELETE',
      }),
    onMutate: async (activityId: string) => {
      const previous = await patch.snapshot();
      patch.apply(activityId, false);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous && patch.restore(context.previous);
    },
    onSettled: () => patch.invalidateAll(),
  });
}

type ReviewEntryVars = {
  entryId: string;
  outcome: 'DONE' | 'MISSED';
  satisfaction: number | null;
  reviewNote: string | null;
};

export function useReviewEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, ...body }: ReviewEntryVars) =>
      apiJson<CalendarEntryDTO>(`/api/calendar/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-pending'] });
    },
  });
}

export function usePendingReviews() {
  const [now] = useState(() => new Date());
  const from = isoDaysFromNow(-PENDING_REVIEWS_WINDOW_DAYS, now);
  const to = now.toISOString();

  return useQuery({
    queryKey: ['calendar-pending', from, to],
    queryFn: async () => {
      const entries = await fetchEntries(from, to);
      const nowMs = now.getTime();
      return entries
        .filter((e) => e.outcome === 'PENDING' && new Date(e.scheduledAt).getTime() < nowMs)
        .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
        .slice(0, PENDING_REVIEWS_LIMIT);
    },
    staleTime: 60_000,
  });
}
