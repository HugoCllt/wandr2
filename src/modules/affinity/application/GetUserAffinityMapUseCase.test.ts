import { describe, expect, it } from 'vitest';

import type { ActivityCategory } from '../../activities/domain/Activity';
import type { IAffinityRepository } from '../domain/IAffinityRepository';
import type { UserCategoryAffinity } from '../domain/UserCategoryAffinity';
import { GetUserAffinityMapUseCase } from './GetUserAffinityMapUseCase';

class FakeAffinityRepository implements IAffinityRepository {
  private readonly byUser = new Map<string, UserCategoryAffinity[]>();

  seed(userId: string, affinities: UserCategoryAffinity[]): void {
    this.byUser.set(userId, affinities);
  }

  async listByUserId(userId: string): Promise<UserCategoryAffinity[]> {
    return this.byUser.get(userId) ?? [];
  }

  async getScoreMap(userId: string): Promise<Map<ActivityCategory, number>> {
    const list = await this.listByUserId(userId);
    return new Map(list.map((a) => [a.category, a.score]));
  }

  async adjustScore(userId: string, category: ActivityCategory, delta: number): Promise<number> {
    const list = this.byUser.get(userId) ?? [];
    const existing = list.find((a) => a.category === category);
    const base = existing?.score ?? 5;
    const next = Math.max(0, Math.min(10, Math.round(base + delta)));
    if (existing) {
      existing.score = next;
    } else {
      list.push({
        id: `aff_${userId}_${category}`,
        userId,
        category,
        score: next,
        updatedAt: new Date('2026-05-01T00:00:00.000Z'),
      });
      this.byUser.set(userId, list);
    }
    return next;
  }
}

function affinity(userId: string, category: ActivityCategory, score: number): UserCategoryAffinity {
  return {
    id: `aff_${userId}_${category}`,
    userId,
    category,
    score,
    updatedAt: new Date('2026-05-01T00:00:00.000Z'),
  };
}

describe('GetUserAffinityMapUseCase', () => {
  it('returns the user affinity map keyed by category', async () => {
    const repo = new FakeAffinityRepository();
    repo.seed('user_1', [affinity('user_1', 'SPORT', 8), affinity('user_1', 'FOOD', 9)]);

    const useCase = new GetUserAffinityMapUseCase(repo);
    const map = await useCase.execute('user_1');

    expect(map.get('SPORT')).toBe(8);
    expect(map.get('FOOD')).toBe(9);
    expect(map.size).toBe(2);
  });

  it('returns an empty map when the user has no affinity rows', async () => {
    const repo = new FakeAffinityRepository();
    const useCase = new GetUserAffinityMapUseCase(repo);

    const map = await useCase.execute('user_unknown');

    expect(map.size).toBe(0);
  });
});
