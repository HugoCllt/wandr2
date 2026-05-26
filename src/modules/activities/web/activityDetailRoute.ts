import { NextResponse } from 'next/server';

import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { toActivityDTO } from '../../../shared/contracts/toActivityDTO';
import { prisma } from '../../../shared/db/prisma';
import { GetActivityUseCase } from '../application/GetActivityUseCase';
import { ActivityNotFoundError } from '../domain/ActivityNotFoundError';
import { PrismaActivityRepository } from '../infra/PrismaActivityRepository';

export async function loadActivityDTOBySlug(slug: string): Promise<ActivityDTO> {
  const useCase = new GetActivityUseCase(new PrismaActivityRepository(prisma));
  const activity = await useCase.execute(slug);
  return toActivityDTO(activity);
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
