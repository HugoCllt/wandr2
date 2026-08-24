import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ActivityDTO } from '@wandr/shared';
import { apiJson } from '../api';

export function useActivity(slug: string): UseQueryResult<ActivityDTO, Error> {
  return useQuery({
    queryKey: ['activity', slug],
    queryFn: () => apiJson<ActivityDTO>(`/api/activities/${slug}`),
    staleTime: 60_000,
  });
}
