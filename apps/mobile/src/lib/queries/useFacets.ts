import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiJson } from '../api';

export type NeighborhoodFacetDTO = {
  name: string;
  count: number;
};

export type NeighborhoodsResultDTO = {
  items: NeighborhoodFacetDTO[];
};

export function useFacets(): UseQueryResult<NeighborhoodsResultDTO, Error> {
  return useQuery({
    queryKey: ['neighborhoods'],
    queryFn: () => apiJson<NeighborhoodsResultDTO>('/api/neighborhoods'),
    staleTime: 60_000,
  });
}
