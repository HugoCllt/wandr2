import { describe, expect, it } from 'vitest';

import type { Activity, ActivityCategory, ActivityCreateInput } from '../domain/Activity';
import type { IActivityRepository } from '../domain/IActivityRepository';
import { CreateActivityUseCase } from './CreateActivityUseCase';

class FakeActivityRepository implements IActivityRepository {
  readonly created: ActivityCreateInput[] = [];
  private nextId = 1;

  async create(input: ActivityCreateInput): Promise<Activity> {
    this.created.push(input);
    const now = new Date('2026-05-23T00:00:00.000Z');
    return { ...input, id: `activity_${this.nextId++}`, createdAt: now, updatedAt: now };
  }
  async findBySlug(): Promise<Activity | null> {
    return null;
  }
  async findById(): Promise<Activity | null> {
    return null;
  }
  async findByIds(): Promise<Activity[]> {
    return [];
  }
  async findCandidates(): Promise<Activity[]> {
    return [];
  }
  async getOrCreateSourceIdByName(): Promise<string> {
    return 'source_1';
  }
  async slugExists(): Promise<boolean> {
    return false;
  }
  async listNeighborhoodFacets() {
    return [];
  }
  async listFeatured(): Promise<Activity[]> {
    return [];
  }
  async listForUpdate(): Promise<Activity[]> {
    return [];
  }
}

const NOW = new Date('2026-05-23T12:00:00.000Z');

const basePlace = {
  title: 'St-Viateur Bagel',
  description: 'Bagels',
  imageUrl: 'https://images.unsplash.com/x',
  kind: 'PLACE' as const,
  categories: { primary: 'FOOD' as const, secondary: [] as ActivityCategory[] },
  address: 'Mile End',
  neighborhood: 'Mile End',
  latitude: 45.5227,
  longitude: -73.6016,
  dateStart: null,
  dateEnd: null,
  priceMinCents: 200,
  priceMaxCents: 2500,
  externalUrl: null,
  indoor: true,
  outdoor: false,
  isFeatured: false,
  status: 'PUBLISHED' as const,
  cityId: 'city_mtl',
};

describe('CreateActivityUseCase', () => {
  it('derives dedupeKey, expiresAt (null for PLACE), and freshness fields', async () => {
    const repo = new FakeActivityRepository();
    const useCase = new CreateActivityUseCase(repo);

    await useCase.execute({ ...basePlace, now: NOW });

    const created = repo.created[0];
    expect(created.dedupeKey).toBe('st-viateur-bagel|45.523,-73.602');
    expect(created.expiresAt).toBeNull();
    expect(created.lastSeenAt).toEqual(NOW);
    expect(created.lastVerifiedAt).toEqual(NOW);
    expect(created.recheckAfter).toEqual(new Date('2026-08-21T12:00:00.000Z'));
  });

  it('sets expiresAt = dateEnd for an EVENT', async () => {
    const repo = new FakeActivityRepository();
    const useCase = new CreateActivityUseCase(repo);

    const dateStart = new Date('2026-06-04T16:00:00.000Z');
    const dateEnd = new Date('2026-06-14T03:00:00.000Z');

    await useCase.execute({
      ...basePlace,
      title: 'MURAL Festival',
      kind: 'EVENT',
      dateStart,
      dateEnd,
      now: NOW,
    });

    const created = repo.created[0];
    expect(created.expiresAt).toEqual(dateEnd);
    expect(created.recheckAfter).toBeNull();
  });
});
