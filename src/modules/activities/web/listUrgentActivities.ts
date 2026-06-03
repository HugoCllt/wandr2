import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { toActivityDTO } from '../../../shared/contracts/toActivityDTO';
import { prisma } from '../../../shared/db/prisma';
import { ListUrgentActivitiesUseCase } from '../application/ListUrgentActivitiesUseCase';
import { PrismaActivityRepository } from '../infra/PrismaActivityRepository';

export async function listUrgentActivities(cityId: string, limit: number): Promise<ActivityDTO[]> {
  const repo = new PrismaActivityRepository(prisma);
  const activities = await new ListUrgentActivitiesUseCase(repo).execute(cityId, new Date(), limit);
  return activities.map(toActivityDTO);
}
