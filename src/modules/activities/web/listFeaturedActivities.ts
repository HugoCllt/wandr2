import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { toActivityDTO } from '../../../shared/contracts/toActivityDTO';
import { prisma } from '../../../shared/db/prisma';
import { ListFeaturedActivitiesUseCase } from '../application/ListFeaturedActivitiesUseCase';
import { PrismaActivityRepository } from '../infra/PrismaActivityRepository';

export async function listFeaturedActivities(limit: number, cityId: string): Promise<ActivityDTO[]> {
  const repo = new PrismaActivityRepository(prisma);
  const activities = await new ListFeaturedActivitiesUseCase(repo).execute(limit, cityId);
  return activities.map(toActivityDTO);
}
