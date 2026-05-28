import type {
  IProfileWriteRepository,
  ProfileUpdateInput,
} from '../domain/IProfileWriteRepository';

/**
 * Writes profile fields + affinities and decides the onboarding flip: the
 * first successful update (when `onboardedAt` is null) marks the user
 * onboarded; later edits leave it untouched.
 */
export class UpdateProfileUseCase {
  constructor(private readonly profiles: IProfileWriteRepository) {}

  async execute(userId: string, input: ProfileUpdateInput): Promise<void> {
    if (input.birthDate.getTime() > Date.now()) {
      throw new Error('birthDate cannot be in the future.');
    }

    const seen = new Set<string>();
    for (const { category, score } of input.affinities) {
      if (seen.has(category)) throw new Error(`Duplicate affinity category: ${category}.`);
      seen.add(category);
      if (!Number.isInteger(score) || score < 0 || score > 10) {
        throw new Error('Affinity score must be an integer between 0 and 10.');
      }
    }

    const onboardedAt = await this.profiles.getOnboardedAt(userId);
    await this.profiles.saveProfile(userId, input, { markOnboarded: onboardedAt === null });
  }
}
