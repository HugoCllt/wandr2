import { describe, expect, it } from 'vitest';

import type { ActivityCategory } from '../../activities/domain/Activity';
import type { IProfileWriteRepository, ProfileUpdateInput } from '../domain/IProfileWriteRepository';
import { UpdateProfileUseCase } from './UpdateProfileUseCase';

class FakeWriteRepository implements IProfileWriteRepository {
  onboardedAt: Date | null = null;
  saved: { userId: string; input: ProfileUpdateInput; markOnboarded: boolean } | null = null;

  async getOnboardedAt(): Promise<Date | null> {
    return this.onboardedAt;
  }

  async saveProfile(
    userId: string,
    input: ProfileUpdateInput,
    opts: { markOnboarded: boolean },
  ): Promise<void> {
    this.saved = { userId, input, markOnboarded: opts.markOnboarded };
  }
}

function makeInput(overrides: Partial<ProfileUpdateInput> = {}): ProfileUpdateInput {
  return {
    gender: 'MALE',
    birthDate: new Date('2000-06-28'),
    cityId: 'city_mtl',
    bio: 'Always one plan ahead.',
    affinities: [
      { category: 'SPORT' as ActivityCategory, score: 8 },
      { category: 'FOOD' as ActivityCategory, score: 9 },
    ],
    ...overrides,
  };
}

describe('UpdateProfileUseCase', () => {
  it('marks the user onboarded the first time (onboardedAt was null)', async () => {
    const repo = new FakeWriteRepository();
    repo.onboardedAt = null;

    await new UpdateProfileUseCase(repo).execute('u1', makeInput());

    expect(repo.saved?.markOnboarded).toBe(true);
  });

  it('does not re-mark onboarding for an already-onboarded user', async () => {
    const repo = new FakeWriteRepository();
    repo.onboardedAt = new Date('2026-01-01T00:00:00.000Z');

    await new UpdateProfileUseCase(repo).execute('u1', makeInput());

    expect(repo.saved?.markOnboarded).toBe(false);
  });

  it('rejects duplicate affinity categories', async () => {
    const repo = new FakeWriteRepository();

    await expect(
      new UpdateProfileUseCase(repo).execute(
        'u1',
        makeInput({
          affinities: [
            { category: 'SPORT' as ActivityCategory, score: 5 },
            { category: 'SPORT' as ActivityCategory, score: 6 },
          ],
        }),
      ),
    ).rejects.toThrow();
    expect(repo.saved).toBeNull();
  });

  it('rejects out-of-range affinity scores', async () => {
    const repo = new FakeWriteRepository();

    await expect(
      new UpdateProfileUseCase(repo).execute(
        'u1',
        makeInput({ affinities: [{ category: 'SPORT' as ActivityCategory, score: 11 }] }),
      ),
    ).rejects.toThrow();
    expect(repo.saved).toBeNull();
  });

  it('rejects a future birthDate', async () => {
    const repo = new FakeWriteRepository();

    await expect(
      new UpdateProfileUseCase(repo).execute(
        'u1',
        makeInput({ birthDate: new Date(Date.now() + 24 * 60 * 60 * 1000) }),
      ),
    ).rejects.toThrow();
  });
});
