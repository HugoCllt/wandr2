import { describe, expect, it } from 'vitest';

import type { Activity, ActivityCreateInput } from '../domain/Activity';
import type { IActivityRepository } from '../domain/IActivityRepository';
import { ListFeaturedActivitiesUseCase } from './ListFeaturedActivitiesUseCase';

class FakeActivityRepository implements IActivityRepository {
  constructor(private readonly featured: Activity[]) {}

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
  async listNeighborhoodFacets() {
    return [];
  }
  async listFeatured(limit: number): Promise<Activity[]> {
    return this.featured.slice(0, limit);
  }
  async listForUpdate(): Promise<Activity[]> {
    return [];
  }
}

function activityFixture(overrides: Partial<Activity> = {}): Activity {
  const created = new Date('2026-04-01T00:00:00.000Z');
  return {
    id: 'activity_1',
    slug: 'a',
    title: 'A',
    description: 'D',
    imageUrl: 'https://images.unsplash.com/x',
    kind: 'PLACE',
    categories: { primary: 'CULTURE', secondary: [] },
    address: 'Montreal',
    neighborhood: null,
    latitude: 45,
    longitude: -73,
    dateStart: null,
    dateEnd: null,
    priceMinCents: 0,
    priceMaxCents: null,
    externalUrl: null,
    indoor: false,
    outdoor: false,
    isFeatured: true,
    status: 'PUBLISHED',
    sourceId: 'src',
    cityId: 'city_mtl',
    dedupeKey: 'a|45.000,-73.000',
    expiresAt: null,
    lastSeenAt: created,
    lastVerifiedAt: null,
    recheckAfter: null,
    createdAt: created,
    updatedAt: created,
    ...overrides,
  };
}

describe('ListFeaturedActivitiesUseCase', () => {
  it('returns up to `limit` featured activities from the repository', async () => {
    const items = [
      activityFixture({ id: '1', slug: 'one' }),
      activityFixture({ id: '2', slug: 'two' }),
      activityFixture({ id: '3', slug: 'three' }),
      activityFixture({ id: '4', slug: 'four' }),
    ];
    const repo = new FakeActivityRepository(items);

    const result = await new ListFeaturedActivitiesUseCase(repo).execute(3);

    expect(result.map((a) => a.slug)).toEqual(['one', 'two', 'three']);
  });

  it('returns an empty list when no featured activities exist', async () => {
    const repo = new FakeActivityRepository([]);

    const result = await new ListFeaturedActivitiesUseCase(repo).execute(3);

    expect(result).toEqual([]);
  });
});
