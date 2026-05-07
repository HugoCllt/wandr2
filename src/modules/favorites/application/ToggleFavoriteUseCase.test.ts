import { describe, expect, it } from 'vitest';

import type { IFavoriteRepository, ToggleFavoriteResult } from '../domain/IFavoriteRepository';
import { ToggleFavoriteUseCase } from './ToggleFavoriteUseCase';

class FakeFavoriteRepository implements IFavoriteRepository {
  private readonly pairs = new Set<string>();

  private key(userId: string, activityId: string): string {
    return `${userId}::${activityId}`;
  }

  async toggle(userId: string, activityId: string): Promise<ToggleFavoriteResult> {
    const key = this.key(userId, activityId);
    if (this.pairs.has(key)) {
      this.pairs.delete(key);
      return { isFavorited: false };
    }
    this.pairs.add(key);
    return { isFavorited: true };
  }

  async isFavorited(userId: string, activityId: string): Promise<boolean> {
    return this.pairs.has(this.key(userId, activityId));
  }

  async listActivityIdsForUser(userId: string): Promise<string[]> {
    return Array.from(this.pairs)
      .filter((p) => p.startsWith(`${userId}::`))
      .map((p) => p.slice(userId.length + 2));
  }
}

describe('ToggleFavoriteUseCase', () => {
  it('adds a favorite when none exists', async () => {
    const repo = new FakeFavoriteRepository();
    const useCase = new ToggleFavoriteUseCase(repo);

    const result = await useCase.execute('user_1', 'activity_1');

    expect(result.isFavorited).toBe(true);
    expect(await repo.isFavorited('user_1', 'activity_1')).toBe(true);
  });

  it('removes a favorite when one exists', async () => {
    const repo = new FakeFavoriteRepository();
    const useCase = new ToggleFavoriteUseCase(repo);

    await useCase.execute('user_1', 'activity_1');
    const result = await useCase.execute('user_1', 'activity_1');

    expect(result.isFavorited).toBe(false);
    expect(await repo.isFavorited('user_1', 'activity_1')).toBe(false);
  });

  it('round-trips: two toggles return to the original state', async () => {
    const repo = new FakeFavoriteRepository();
    const useCase = new ToggleFavoriteUseCase(repo);

    expect(await repo.isFavorited('user_1', 'activity_1')).toBe(false);
    await useCase.execute('user_1', 'activity_1');
    await useCase.execute('user_1', 'activity_1');
    expect(await repo.isFavorited('user_1', 'activity_1')).toBe(false);
  });

  it('isolates favorites by user', async () => {
    const repo = new FakeFavoriteRepository();
    const useCase = new ToggleFavoriteUseCase(repo);

    await useCase.execute('user_1', 'activity_1');
    expect(await repo.isFavorited('user_2', 'activity_1')).toBe(false);
  });
});
