import type { Prisma, PrismaClient } from '@prisma/client';

import type { IFavoriteRepository, ToggleFavoriteResult } from '../domain/IFavoriteRepository';

const UNIQUE_VIOLATION = 'P2002';

export class PrismaFavoriteRepository implements IFavoriteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async toggle(userId: string, activityId: string): Promise<ToggleFavoriteResult> {
    try {
      await this.prisma.favorite.create({
        data: { userId, activityId },
        select: { id: true },
      });
      return { isFavorited: true };
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        await this.prisma.favorite.delete({
          where: { userId_activityId: { userId, activityId } },
        });
        return { isFavorited: false };
      }
      throw error;
    }
  }

  async isFavorited(userId: string, activityId: string): Promise<boolean> {
    const row = await this.prisma.favorite.findUnique({
      where: { userId_activityId: { userId, activityId } },
      select: { id: true },
    });
    return row !== null;
  }

  async listActivityIdsForUser(userId: string): Promise<string[]> {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      select: { activityId: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => r.activityId);
  }
}

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as Prisma.PrismaClientKnownRequestError).code === UNIQUE_VIOLATION
  );
}
