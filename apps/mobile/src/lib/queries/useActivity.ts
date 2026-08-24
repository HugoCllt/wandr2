import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ActivityDetailDTO } from '@wandr/shared';
import { apiJson, ApiError } from '../api';

export function useActivity(slug: string): UseQueryResult<ActivityDetailDTO, Error> {
  return useQuery({
    queryKey: ['activity', slug],
    queryFn: () => apiJson<ActivityDetailDTO>(`/api/activities/${slug}`),
    staleTime: 60_000,
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 1,
  });
}
