import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ActivityDTO } from '@wandr/shared';
import { apiJson, ApiError } from '../api';

export function useActivity(slug: string): UseQueryResult<ActivityDTO, Error> {
  return useQuery({
    queryKey: ['activity', slug],
    queryFn: () => apiJson<ActivityDTO>(`/api/activities/${slug}`),
    staleTime: 60_000,
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 1,
  });
}
