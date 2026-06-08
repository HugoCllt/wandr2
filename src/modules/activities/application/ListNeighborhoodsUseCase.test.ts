import { describe, expect, it } from 'vitest';

import type { Activity, ActivityCreateInput } from '../domain/Activity';
import type { IActivityRepository } from '../domain/IActivityRepository';
import { ListNeighborhoodsUseCase } from './ListNeighborhoodsUseCase';

class FakeActivityRepository implements IActivityRepository {
  constructor(private readonly neighborhoods: string[]) {}

  async create(_input: ActivityCreateInput): Promise<Activity> {
    throw new Error('not used in this test');
  }
  async findBySlug(_slug: string): Promise<Activity | null> {
    return null;
  }
  async findById(_id: string): Promise<Activity | null> {
    return null;
  }
  async findByIds(_ids: ReadonlyArray<string>): Promise<Activity[]> {
    return [];
  }
  async findCandidates(): Promise<Activity[]> {
    return [];
  }
  async getOrCreateSourceIdByName(_name: string): Promise<string> {
    return 'src';
  }
  async slugExists(_slug: string): Promise<boolean> {
    return false;
  }
  async listNeighborhoods(): Promise<string[]> {
    return this.neighborhoods;
  }
  async listFeatured(_limit: number): Promise<Activity[]> {
    return [];
  }
  async listForUpdate(): Promise<Activity[]> {
    return [];
  }
}

describe('ListNeighborhoodsUseCase', () => {
  it('returns the repository neighborhoods sorted alphabetically', async () => {
    const repo = new FakeActivityRepository(['Mile End', 'Plateau-Mont-Royal', 'Verdun']);

    const useCase = new ListNeighborhoodsUseCase(repo);
    const result = await useCase.execute();

    expect(result).toEqual(['Mile End', 'Plateau-Mont-Royal', 'Verdun']);
  });

  it('returns an empty list when the catalog has no neighborhoods', async () => {
    const repo = new FakeActivityRepository([]);

    const useCase = new ListNeighborhoodsUseCase(repo);
    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
