import { NextResponse } from 'next/server';

import { PrismaActivityRepository } from '../../activities/infra/PrismaActivityRepository';
import { GetUserAffinityMapUseCase } from '../../affinity/application/GetUserAffinityMapUseCase';
import { PrismaAffinityRepository } from '../../affinity/infra/PrismaAffinityRepository';
import { PrismaCalendarRepository } from '../../calendar/infra/PrismaCalendarRepository';
import { PrismaFavoriteRepository } from '../../favorites/infra/PrismaFavoriteRepository';
import { parseFilters } from '../../filters/application/url-codec';
import { getOptionalUser } from '../../../shared/auth/current-user';
import type { ActivityCategory } from '../../activities/domain/Activity';
import type { FeedItemDTO, FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';
import { toActivityDTO } from '../../../shared/contracts/toActivityDTO';
import { prisma } from '../../../shared/db/prisma';
import type { FilterValueDTO } from '../../../shared/contracts/FilterValueDTO';
import { CATEGORY_PRESETS, isCategoryKey } from '../../../shared/presets/CATEGORY_PRESETS';
import { HOME_PRESET } from '../../../shared/presets/HOME_PRESET';
import { GetFeedUseCase } from '../application/GetFeedUseCase';
import { DEFAULT_FEED_LIMIT } from '../domain/FeedQuery';

function resolveBaseFiltersFromParams(searchParams: URLSearchParams): FilterValueDTO | null {
  const preset = searchParams.get('preset');
  if (preset && isCategoryKey(preset)) {
    return CATEGORY_PRESETS[preset].baseFilters;
  }
  return null;
}

const MAX_FEED_LIMIT = 50;

export async function loadFeedDTO(
  searchParams: URLSearchParams,
  baseFiltersOverride?: FilterValueDTO,
): Promise<FeedResultDTO> {
  const baseFilters =
    baseFiltersOverride ?? resolveBaseFiltersFromParams(searchParams) ?? HOME_PRESET.baseFilters;
  const filters = parseFilters(searchParams);
  const cursor = searchParams.get('cursor');
  const limit = parseLimit(searchParams.get('limit'));

  // Anonymous browsing is allowed on the feed pages: without a session the feed
  // is generic (no affinity ranking, no favourites/bookmarks), scoped to the
  // default city.
  const user = await getOptionalUser();
  const affinityMap = user
    ? await new GetUserAffinityMapUseCase(new PrismaAffinityRepository(prisma)).execute(user.id)
    : new Map<ActivityCategory, number>();
  const favoritedIds = user
    ? new Set(await new PrismaFavoriteRepository(prisma).listActivityIdsForUser(user.id))
    : new Set<string>();
  const bookmarkedIds = user
    ? new Set(await new PrismaCalendarRepository(prisma).listActivityIdsForUser(user.id))
    : new Set<string>();
  const cityId = user?.cityId ?? (await defaultCityId());

  const useCase = new GetFeedUseCase(new PrismaActivityRepository(prisma));
  const result = await useCase.execute({
    filters,
    cursor,
    limit,
    affinityMap,
    now: new Date(),
    cityId,
    baseFilters,
  });

  return {
    items: result.items.map(
      (item): FeedItemDTO => ({
        ...toActivityDTO(item),
        matchScore: item.matchScore,
        isFavorited: favoritedIds.has(item.id),
        isBookmarked: bookmarkedIds.has(item.id),
      }),
    ),
    nextCursor: result.nextCursor,
  };
}

export async function feedRouteHandler(request: Request): Promise<NextResponse> {
  const dto = await loadFeedDTO(new URL(request.url).searchParams);
  return NextResponse.json(dto);
}

/** The only seeded city — backs the generic feed for anonymous visitors. */
async function defaultCityId(): Promise<string> {
  const city = await prisma.city.findUniqueOrThrow({ where: { slug: 'montreal' } });
  return city.id;
}

function parseLimit(raw: string | null): number {
  if (!raw || !/^\d+$/.test(raw)) return DEFAULT_FEED_LIMIT;
  const n = Number(raw);
  if (n <= 0) return DEFAULT_FEED_LIMIT;
  return Math.min(n, MAX_FEED_LIMIT);
}
