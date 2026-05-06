import type { ActivityCategory } from '../../activities/domain/Activity';
import type { UserCategoryAffinity } from './UserCategoryAffinity';

export interface IAffinityRepository {
  listByUserId(userId: string): Promise<UserCategoryAffinity[]>;
  getScoreMap(userId: string): Promise<Map<ActivityCategory, number>>;
}
