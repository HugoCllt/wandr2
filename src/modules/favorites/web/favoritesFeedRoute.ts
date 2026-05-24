import { NextResponse } from 'next/server';

import { PrismaActivityRepository } from '../../activities/infra/PrismaActivityRepository';
import { GetUserAffinityMapUseCase } from '../../affinity/application/GetUserAffinityMapUseCase';
import { PrismaAffinityRepository } from '../../affinity/infra/PrismaAffinityRepository';
import { GetFeedUseCase } from '../../feed/application/GetFeedUseCase';
import { DEFAULT_FEED_LIMIT } from '../../feed/domain/FeedQuery';
import { parseFilters } from '../../filters/application/url-codec';
import { getCurrentUser } from '../../../shared/auth/current-user';
import type { FeedItemDTO, FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';
import { toActivityDTO } from '../../../shared/contracts/toActivityDTO';
import { prisma } from '../../../shared/db/prisma';
import { FAVORITES_PRESET } from '../../../shared/presets/FAVORITES_PRESET';
import { ListFavoritesUseCase } from '../application/ListFavoritesUseCase';
import { PrismaFavoriteRepository } from '../infra/PrismaFavoriteRepository';

const MAX_FEED_LIMIT = 50;

export async function loadFavoritesFeedDTO(searchParams: URLSearchParams): Promise<FeedResultDTO> {
  const filters = parseFilters(searchParams);
  const cursor = searchParams.get('cursor');
  const limit = parseLimit(searchParams.get('limit'));

  const user = await getCurrentUser();
  const affinityMap = await new GetUserAffinityMapUseCase(
    new PrismaAffinityRepository(prisma),
  ).execute(user.id);

  const favoriteRepo = new PrismaFavoriteRepository(prisma);
  const useCase = new ListFavoritesUseCase(
    favoriteRepo,
    new GetFeedUseCase(new PrismaActivityRepository(prisma)),
  );
  const result = await useCase.execute({
    userId: user.id,
    filters,
    cursor,
    limit,
    affinityMap,
    now: new Date(),
    cityId: user.cityId,
    baseFilters: FAVORITES_PRESET.baseFilters,
  });

  return {
    items: result.items.map(
      (item): FeedItemDTO => ({
        ...toActivityDTO(item),
        matchScore: item.matchScore,
        isFavorited: true,
      }),
    ),
    nextCursor: result.nextCursor,
  };
}

export async function favoritesFeedRouteHandler(
  searchParams: URLSearchParams,
): Promise<NextResponse> {
  const dto = await loadFavoritesFeedDTO(searchParams);
  return NextResponse.json(dto);
}

function parseLimit(raw: string | null): number {
  if (!raw || !/^\d+$/.test(raw)) return DEFAULT_FEED_LIMIT;
  const n = Number(raw);
  if (n <= 0) return DEFAULT_FEED_LIMIT;
  return Math.min(n, MAX_FEED_LIMIT);
}
