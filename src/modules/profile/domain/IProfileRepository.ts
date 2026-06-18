import type { UserActivityHistoryEntry } from './UserActivityHistoryEntry';
import type { UserCategoryBreakdown } from './UserCategoryBreakdown';
import type { UserProfile } from './UserProfile';
import type { UserStats } from './UserStats';

export type ProfileView = {
  profile: UserProfile;
  stats: UserStats;
  breakdown: UserCategoryBreakdown;
  history: UserActivityHistoryEntry[];
  /** Live totals backing the Quick Actions tiles. */
  counts: { favorites: number; history: number };
};

export interface IProfileRepository {
  getProfileView(userId: string): Promise<ProfileView>;
}
