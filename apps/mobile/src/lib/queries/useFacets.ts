import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { NeighborhoodsResultDTO } from '@wandr/shared';
import { apiJson } from '../api';

export function useFacets(): UseQueryResult<NeighborhoodsResultDTO, Error> {
  return useQuery({
    queryKey: ['neighborhoods'],
    queryFn: () => apiJson<NeighborhoodsResultDTO>('/api/neighborhoods'),
    staleTime: 60_000,
  });
}
