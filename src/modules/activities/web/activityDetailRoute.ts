import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { toActivityDTO } from '../../../shared/contracts/toActivityDTO';
import { prisma } from '../../../shared/db/prisma';
import { GetActivityUseCase } from '../application/GetActivityUseCase';
import { PrismaActivityRepository } from '../infra/PrismaActivityRepository';

// ActivityNotFoundError throws out of the use case → handleApiError maps it to 404.
export async function loadActivityDTOBySlug(slug: string): Promise<ActivityDTO> {
  const useCase = new GetActivityUseCase(new PrismaActivityRepository(prisma));
  const activity = await useCase.execute(slug);
  return toActivityDTO(activity);
}
