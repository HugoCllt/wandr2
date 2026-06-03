import { describe, expect, it } from 'vitest';

import type { Activity, ActivityCreateInput } from '../domain/Activity';
import type { IActivityRepository } from '../domain/IActivityRepository';
import { ListUrgentActivitiesUseCase, URGENT_WINDOW_DAYS } from './ListUrgentActivitiesUseCase';

class FakeActivityRepository implements IActivityRepository {
  public lastCall: { cityId: string; now: Date; until: Date; limit: number } | null = null;

  constructor(private readonly urgent: Activity[]) {}

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
    return [];
  }
  async listFeatured(_limit: number): Promise<Activity[]> {
    return [];
  }
  async listUrgent(cityId: string, now: Date, until: Date, limit: number): Promise<Activity[]> {
    this.lastCall = { cityId, now, until, limit };
    return this.urgent.slice(0, limit);
  }
}

function activityFixture(overrides: Partial<Activity> = {}): Activity {
  const created = new Date('2026-04-01T00:00:00.000Z');
  return {
    id: 'activity_1',
    slug: 'a',
    title: 'A',
    description: 'D',
    imageUrl: null,
    kind: 'EVENT',
    categories: { primary: 'CULTURE', secondary: [] },
    address: 'Montreal',
    neighborhood: null,
    latitude: 45,
    longitude: -73,
    dateStart: created,
    dateEnd: created,
    priceMinCents: 0,
    priceMaxCents: null,
    externalUrl: null,
    indoor: false,
    outdoor: false,
    isFeatured: false,
    status: 'PUBLISHED',
    sourceId: 'src',
    cityId: 'city_mtl',
    dedupeKey: 'a|45.000,-73.000',
    expiresAt: created,
    lastSeenAt: created,
    lastVerifiedAt: null,
    recheckAfter: null,
    createdAt: created,
    updatedAt: created,
    ...overrides,
  };
}

describe('ListUrgentActivitiesUseCase', () => {
  it('queries the repository with a window of URGENT_WINDOW_DAYS after now', async () => {
    const repo = new FakeActivityRepository([activityFixture()]);
    const now = new Date('2026-06-03T00:00:00.000Z');

    await new ListUrgentActivitiesUseCase(repo).execute('city_mtl', now, 5);

    const expectedUntil = new Date(now.getTime() + URGENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    expect(repo.lastCall).toEqual({ cityId: 'city_mtl', now, until: expectedUntil, limit: 5 });
  });

  it('returns up to `limit` urgent activities from the repository', async () => {
    const repo = new FakeActivityRepository([
      activityFixture({ id: '1', slug: 'one' }),
      activityFixture({ id: '2', slug: 'two' }),
      activityFixture({ id: '3', slug: 'three' }),
    ]);

    const result = await new ListUrgentActivitiesUseCase(repo).execute(
      'city_mtl',
      new Date('2026-06-03T00:00:00.000Z'),
      2,
    );

    expect(result.map((a) => a.slug)).toEqual(['one', 'two']);
  });

  it('rejects a non-positive limit', async () => {
    const repo = new FakeActivityRepository([]);

    await expect(
      new ListUrgentActivitiesUseCase(repo).execute('city_mtl', new Date(), 0),
    ).rejects.toThrow('limit must be a positive integer');
  });

  it('rejects an empty cityId', async () => {
    const repo = new FakeActivityRepository([]);

    await expect(
      new ListUrgentActivitiesUseCase(repo).execute('  ', new Date(), 5),
    ).rejects.toThrow('cityId is required');
  });
});
