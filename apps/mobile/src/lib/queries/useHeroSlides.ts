import { useMemo } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ActivityDTO, CategoryKey, FeedResultDTO } from '@wandr/shared';
import { apiJson } from '../api';

export const HERO_SLIDE_LIMIT = 3;
const HERO_FEED_LIMIT = 24;

function withImage(activities: ActivityDTO[]): ActivityDTO[] {
  return activities.filter((activity) => Boolean(activity.imageUrl));
}

async function fetchHeroSlides(preset: CategoryKey | undefined): Promise<ActivityDTO[]> {
  if (preset) {
    const result = await apiJson<FeedResultDTO>(`/api/feed?preset=${preset}&limit=${HERO_FEED_LIMIT}`);
    return withImage(result.items).slice(0, HERO_SLIDE_LIMIT);
  }
  const featured = await apiJson<ActivityDTO[]>(`/api/activities/featured?limit=${HERO_SLIDE_LIMIT}`);
  return withImage(featured);
}

export function useHeroSlides(preset?: CategoryKey): UseQueryResult<ActivityDTO[]> {
  return useQuery({
    queryKey: preset ? ['hero', preset] : ['activities-featured', HERO_SLIDE_LIMIT],
    queryFn: () => fetchHeroSlides(preset),
    staleTime: 60_000,
  });
}

const NO_IDS: string[] = [];

export function useHeroSlideIds(preset?: CategoryKey): string[] {
  const { data } = useHeroSlides(preset);
  return useMemo(() => (data ? data.map((activity) => activity.id) : NO_IDS), [data]);
}
