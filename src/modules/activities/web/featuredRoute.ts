import { NextResponse } from 'next/server';
import { z } from 'zod';

import { parseQuery } from '../../../shared/api/parse';
import { getActiveCity } from './activeCity';
import { listFeaturedActivities } from './listFeaturedActivities';

const DEFAULT_FEATURED_LIMIT = 3;
const MAX_FEATURED_LIMIT = 50;

const FeaturedQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(MAX_FEATURED_LIMIT).optional().default(DEFAULT_FEATURED_LIMIT),
});

export async function getFeaturedActivitiesRouteHandler(request: Request): Promise<NextResponse> {
  const { limit } = parseQuery(FeaturedQuerySchema, new URL(request.url).searchParams);
  const city = await getActiveCity();
  const activities = await listFeaturedActivities(limit, city.id);
  return NextResponse.json(activities);
}
