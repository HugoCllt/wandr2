import { NextResponse } from 'next/server';

import type {
  NeighborhoodsResultDTO,
  NeighborhoodSummaryDTO,
} from '../../../shared/contracts/NeighborhoodDTO';
import { getActiveCity } from './activeCity';
import { listNeighborhoods } from './listNeighborhoods';

export async function getNeighborhoodsRouteHandler(): Promise<NextResponse> {
  const city = await getActiveCity();
  const facets = await listNeighborhoods(city.id);
  const items: NeighborhoodSummaryDTO[] = facets.map((facet) => ({
    name: facet.name,
    count: facet.categories.length,
  }));
  const result: NeighborhoodsResultDTO = { items };
  return NextResponse.json(result);
}
