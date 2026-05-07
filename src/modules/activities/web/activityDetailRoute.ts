import { NextResponse } from 'next/server';

import { getCurrentUser } from '../../../shared/auth/current-user';
import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { toActivityDTO } from '../../../shared/contracts/toActivityDTO';
import { prisma } from '../../../shared/db/prisma';
import { PrismaFavoriteRepository } from '../../favorites/infra/PrismaFavoriteRepository';
import { GetActivityUseCase } from '../application/GetActivityUseCase';
import { ActivityNotFoundError } from '../domain/ActivityNotFoundError';
import { PrismaActivityRepository } from '../infra/PrismaActivityRepository';

export async function loadActivityDTOBySlug(slug: string): Promise<ActivityDTO> {
  const useCase = new GetActivityUseCase(new PrismaActivityRepository(prisma));
  const activity = await useCase.execute(slug);
  return toActivityDTO(activity);
}

export async function loadActivityWithFavoriteBySlug(
  slug: string,
): Promise<{ activity: ActivityDTO; isFavorited: boolean }> {
  const useCase = new GetActivityUseCase(new PrismaActivityRepository(prisma));
  const activity = await useCase.execute(slug);
  const user = await getCurrentUser();
  const isFavorited = await new PrismaFavoriteRepository(prisma).isFavorited(user.id, activity.id);
  return { activity: toActivityDTO(activity), isFavorited };
}

export async function getActivityBySlug(slug: string): Promise<NextResponse> {
  try {
    const dto = await loadActivityDTOBySlug(slug);
    return NextResponse.json(dto);
  } catch (error) {
    if (error instanceof ActivityNotFoundError) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }
    throw error;
  }
}
