import { getCurrentUser } from '../../../shared/auth/current-user';
import { prisma } from '../../../shared/db/prisma';
import { PrismaFavoriteRepository } from '../infra/PrismaFavoriteRepository';

export async function loadCurrentUserFavoritedIds(): Promise<ReadonlySet<string>> {
  const user = await getCurrentUser();
  const ids = await new PrismaFavoriteRepository(prisma).listActivityIdsForUser(user.id);
  return new Set(ids);
}
