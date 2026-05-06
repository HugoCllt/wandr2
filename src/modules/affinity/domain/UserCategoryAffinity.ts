import type { ActivityCategory } from '../../activities/domain/Activity';

export type UserCategoryAffinity = {
  id: string;
  userId: string;
  category: ActivityCategory;
  score: number;
  updatedAt: Date;
};

export type UserCategoryAffinityCreateInput = Omit<UserCategoryAffinity, 'id' | 'updatedAt'>;

export function createUserCategoryAffinity(
  input: UserCategoryAffinityCreateInput,
): UserCategoryAffinityCreateInput {
  if (input.userId.trim().length === 0) {
    throw new Error('Affinity userId is required.');
  }

  if (!Number.isInteger(input.score) || input.score < 0 || input.score > 10) {
    throw new Error('Affinity score must be an integer between 0 and 10.');
  }

  return input;
}
