import type { PrismaClient } from '@prisma/client';

import type { IRecommendationContextRepository } from '../domain/IRecommendationContextRepository';
import type { UserRecommendationContext } from '../domain/UserRecommendationContext';

const RECENT_LIMIT = 5;

/**
 * Loads the user's long-term memory for the recommendation graph in one place:
 * bio + category affinities + recent favorites + recent calendar history. A
 * single adapter rather than borrowing four sibling modules — same shape as
 * `PrismaProfileRepository`. Single-city POC, so `cityId` is unused for now.
 */
export class PrismaRecommendationContextRepository implements IRecommendationContextRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async load(userId: string, _cityId: string): Promise<UserRecommendationContext> {
    const [user, affinities, favorites, history] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { bio: true } }),
      this.prisma.userCategoryAffinity.findMany({
        where: { userId },
        orderBy: { score: 'desc' },
        select: { category: true },
      }),
      this.prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
        select: { activity: { select: { title: true } } },
      }),
      this.prisma.calendarEntry.findMany({
        where: { userId },
        orderBy: { scheduledAt: 'desc' },
        take: RECENT_LIMIT,
        select: { activity: { select: { title: true } } },
      }),
    ]);

    return {
      bio: user.bio,
      topCategories: affinities.map((a) => a.category),
      recentFavorites: favorites.map((f) => f.activity.title),
      recentHistory: history.map((h) => h.activity.title),
    };
  }
}
