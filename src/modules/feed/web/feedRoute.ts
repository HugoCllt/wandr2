import { NextResponse } from 'next/server';

import { PrismaActivityRepository } from '../../activities/infra/PrismaActivityRepository';
import { GetUserAffinityMapUseCase } from '../../affinity/application/GetUserAffinityMapUseCase';
import { PrismaAffinityRepository } from '../../affinity/infra/PrismaAffinityRepository';
import { parseFilters } from '../../filters/application/url-codec';
import { getCurrentUser } from '../../../shared/auth/current-user';
import type { FeedItemDTO, FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';
import { toActivityDTO } from '../../../shared/contracts/toActivityDTO';
import { prisma } from '../../../shared/db/prisma';
import { HOME_PRESET } from '../../../shared/presets/HOME_PRESET';
import { GetFeedUseCase } from '../application/GetFeedUseCase';
import { DEFAULT_FEED_LIMIT } from '../domain/FeedQuery';

const MAX_FEED_LIMIT = 50;

export async function loadFeedDTO(searchParams: URLSearchParams): Promise<FeedResultDTO> {
  const filters = parseFilters(searchParams);
  const cursor = searchParams.get('cursor');
  const limit = parseLimit(searchParams.get('limit'));

  const user = await getCurrentUser();
  const affinityMap = await new GetUserAffinityMapUseCase(
    new PrismaAffinityRepository(prisma),
  ).execute(user.id);

  const useCase = new GetFeedUseCase(new PrismaActivityRepository(prisma));
  const result = await useCase.execute({
    filters,
    cursor,
    limit,
    affinityMap,
    now: new Date(),
    baseFilters: HOME_PRESET.baseFilters,
  });

  return {
    items: result.items.map(
      (item): FeedItemDTO => ({
        ...toActivityDTO(item),
        matchScore: item.matchScore,
      }),
    ),
    nextCursor: result.nextCursor,
  };
}

export async function feedRouteHandler(searchParams: URLSearchParams): Promise<NextResponse> {
  const dto = await loadFeedDTO(searchParams);
  return NextResponse.json(dto);
}

function parseLimit(raw: string | null): number {
  if (!raw || !/^\d+$/.test(raw)) return DEFAULT_FEED_LIMIT;
  const n = Number(raw);
  if (n <= 0) return DEFAULT_FEED_LIMIT;
  return Math.min(n, MAX_FEED_LIMIT);
}
