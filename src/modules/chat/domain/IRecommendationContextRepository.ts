import type { UserRecommendationContext } from './UserRecommendationContext';

/**
 * Port the recommendation graph reads the user's long-term memory through:
 * bio, category affinities, recent favorites and calendar history, assembled
 * into one compact context. Scoped to a single (user, city).
 */
export interface IRecommendationContextRepository {
  load(userId: string, cityId: string): Promise<UserRecommendationContext>;
}
