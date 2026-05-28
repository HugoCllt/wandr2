import type { ActivityCategory } from '../../activities/domain/Activity';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type ProfileAffinityInput = { category: ActivityCategory; score: number };

export type ProfileUpdateInput = {
  gender: Gender;
  birthDate: Date;
  cityId: string;
  bio: string;
  affinities: ProfileAffinityInput[];
};

export interface IProfileWriteRepository {
  /** Current onboarding timestamp (null = never onboarded). */
  getOnboardedAt(userId: string): Promise<Date | null>;
  /**
   * Persist the profile fields and upsert affinities in one transaction.
   * `markOnboarded` sets `onboardedAt = now()` (decided by the use case so the
   * "first time only" rule is unit-testable).
   */
  saveProfile(
    userId: string,
    input: ProfileUpdateInput,
    opts: { markOnboarded: boolean },
  ): Promise<void>;
}
