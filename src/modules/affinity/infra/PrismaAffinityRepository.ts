import type { UserCategoryAffinity as PrismaAffinityModel } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import type { ActivityCategory } from '../../activities/domain/Activity';
import type { IAffinityRepository } from '../domain/IAffinityRepository';
import type { UserCategoryAffinity } from '../domain/UserCategoryAffinity';

export class PrismaAffinityRepository implements IAffinityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByUserId(userId: string): Promise<UserCategoryAffinity[]> {
    const affinities = await this.prisma.userCategoryAffinity.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    });

    return affinities.map(toAffinity);
  }

  async getScoreMap(userId: string): Promise<Map<ActivityCategory, number>> {
    const affinities = await this.listByUserId(userId);
    return new Map(affinities.map((affinity) => [affinity.category, affinity.score]));
  }
}

function toAffinity(affinity: PrismaAffinityModel): UserCategoryAffinity {
  return {
    id: affinity.id,
    userId: affinity.userId,
    category: affinity.category,
    score: affinity.score,
    updatedAt: affinity.updatedAt,
  };
}
