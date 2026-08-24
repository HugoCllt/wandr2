import { NextResponse } from 'next/server';

import { getActiveCity } from './activeCity';
import { listNeighborhoods } from './listNeighborhoods';

export type NeighborhoodSummaryDTO = {
  name: string;
  count: number;
};

export async function getNeighborhoodsRouteHandler(): Promise<NextResponse> {
  const city = await getActiveCity();
  const facets = await listNeighborhoods(city.id);
  const items: NeighborhoodSummaryDTO[] = facets.map((facet) => ({
    name: facet.name,
    count: facet.categories.length,
  }));
  return NextResponse.json({ items });
}
