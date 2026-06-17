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

  async adjustScore(
    userId: string,
    category: ActivityCategory,
    delta: number,
  ): Promise<number> {
    const existing = await this.prisma.userCategoryAffinity.findUnique({
      where: { userId_category: { userId, category } },
      select: { score: true },
    });
    const base = existing?.score ?? DEFAULT_AFFINITY_SCORE;
    const next = clampScore(base + delta);
    await this.prisma.userCategoryAffinity.upsert({
      where: { userId_category: { userId, category } },
      create: { userId, category, score: next },
      update: { score: next },
    });
    return next;
  }
}

/** Neutral starting point when a user has no explicit affinity for a category. */
const DEFAULT_AFFINITY_SCORE = 5;

function clampScore(score: number): number {
  return Math.max(0, Math.min(10, Math.round(score)));
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
