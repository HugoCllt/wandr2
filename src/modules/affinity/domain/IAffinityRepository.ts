import type { ActivityCategory } from '../../activities/domain/Activity';
import type { UserCategoryAffinity } from './UserCategoryAffinity';

export interface IAffinityRepository {
  listByUserId(userId: string): Promise<UserCategoryAffinity[]>;
  getScoreMap(userId: string): Promise<Map<ActivityCategory, number>>;
  /**
   * Nudge a category's affinity by `delta`, clamped to the 0–10 scale. Creates
   * the row from the neutral default when the user has no score yet. Returns the
   * resulting score.
   */
  adjustScore(userId: string, category: ActivityCategory, delta: number): Promise<number>;
}
