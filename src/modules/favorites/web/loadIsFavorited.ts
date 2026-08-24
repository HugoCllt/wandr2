import { prisma } from '../../../shared/db/prisma';
import { PrismaFavoriteRepository } from '../infra/PrismaFavoriteRepository';

export async function loadIsFavorited(userId: string, activityId: string): Promise<boolean> {
  return new PrismaFavoriteRepository(prisma).isFavorited(userId, activityId);
}
