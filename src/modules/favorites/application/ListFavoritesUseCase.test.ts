import { describe, expect, it } from 'vitest';

import type {
  Activity,
  ActivityCategory,
  ActivityCreateInput,
} from '../../activities/domain/Activity';
import type { ActivityCandidateCriteria } from '../../activities/domain/ActivityCandidateCriteria';
import type { IActivityRepository } from '../../activities/domain/IActivityRepository';
import { GetFeedUseCase } from '../../feed/application/GetFeedUseCase';
import type { IFavoriteRepository, ToggleFavoriteResult } from '../domain/IFavoriteRepository';
import { ListFavoritesUseCase } from './ListFavoritesUseCase';

const NOW = new Date('2026-05-06T12:00:00.000Z');

class FakeActivityRepository implements IActivityRepository {
  private readonly bySlug = new Map<string, Activity>();

  seed(activities: Activity[]): void {
    for (const a of activities) this.bySlug.set(a.slug, a);
  }

  async create(_input: ActivityCreateInput): Promise<Activity> {
    throw new Error('not used');
  }

  async findBySlug(slug: string): Promise<Activity | null> {
    return this.bySlug.get(slug) ?? null;
  }

  async findById(id: string): Promise<Activity | null> {
    for (const activity of this.bySlug.values()) {
      if (activity.id === id) return activity;
    }
    return null;
  }

  async findByIds(ids: ReadonlyArray<string>): Promise<Activity[]> {
    return Array.from(this.bySlug.values()).filter((a) => ids.includes(a.id));
  }

  async findCandidates(criteria: ActivityCandidateCriteria): Promise<Activity[]> {
    return Array.from(this.bySlug.values()).filter((a) => {
      if (a.cityId !== criteria.cityId) return false;
      if (a.status !== criteria.status) return false;
      if (criteria.activityIds) {
        if (!criteria.activityIds.includes(a.id)) return false;
      }
      if (criteria.kinds && !criteria.kinds.includes(a.kind)) return false;
      if (criteria.categories) {
        const set = [a.categories.primary, ...a.categories.secondary];
        if (!criteria.categories.some((c) => set.includes(c))) return false;
      }
      return true;
    });
  }

  async getOrCreateSourceIdByName(): Promise<string> {
    return 'source_1';
  }

  async slugExists(slug: string): Promise<boolean> {
    return this.bySlug.has(slug);
  }

  async listNeighborhoods(): Promise<string[]> {
    return [];
  }

  async listFeatured(): Promise<Activity[]> {
    return [];
  }
  async listForUpdate(): Promise<Activity[]> {
    return [];
  }
}

class FakeFavoriteRepository implements IFavoriteRepository {
  private readonly pairs = new Set<string>();

  seed(userId: string, activityIds: string[]): void {
    for (const id of activityIds) this.pairs.add(`${userId}::${id}`);
  }

  async toggle(userId: string, activityId: string): Promise<ToggleFavoriteResult> {
    const k = `${userId}::${activityId}`;
    if (this.pairs.has(k)) {
      this.pairs.delete(k);
      return { isFavorited: false };
    }
    this.pairs.add(k);
    return { isFavorited: true };
  }

  async isFavorited(userId: string, activityId: string): Promise<boolean> {
    return this.pairs.has(`${userId}::${activityId}`);
  }

  async listActivityIdsForUser(userId: string): Promise<string[]> {
    const prefix = `${userId}::`;
    return Array.from(this.pairs)
      .filter((p) => p.startsWith(prefix))
      .map((p) => p.slice(prefix.length));
  }
}

let counter = 1;

function activity(overrides: Partial<Activity>): Activity {
  const id = overrides.id ?? `activity_${counter++}`;
  const createdAt = overrides.createdAt ?? new Date('2026-04-01T00:00:00.000Z');
  return {
    id,
    slug: overrides.slug ?? id,
    title: 'A',
    description: 'D',
    imageUrl: 'https://images.unsplash.com/x',
    kind: 'PLACE',
    categories: { primary: 'CULTURE', secondary: [] },
    address: 'Montreal',
    neighborhood: 'Plateau',
    latitude: 45.5,
    longitude: -73.5,
    dateStart: null,
    dateEnd: null,
    priceMinCents: 0,
    priceMaxCents: null,
    externalUrl: null,
    indoor: false,
    outdoor: false,
    isFeatured: false,
    status: 'PUBLISHED',
    sourceId: 'source_1',
    cityId: 'city_mtl',
    dedupeKey: id,
    expiresAt: null,
    lastSeenAt: createdAt,
    lastVerifiedAt: null,
    recheckAfter: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

const EMPTY_AFFINITY: Map<ActivityCategory, number> = new Map();

describe('ListFavoritesUseCase', () => {
  it('returns an empty result when the user has no favorites', async () => {
    const activities = new FakeActivityRepository();
    activities.seed([activity({ id: 'a', slug: 'a' })]);
    const favorites = new FakeFavoriteRepository();
    const useCase = new ListFavoritesUseCase(favorites, new GetFeedUseCase(activities));

    const result = await useCase.execute({
      userId: 'user_1',
      filters: {},
      cursor: null,
      affinityMap: EMPTY_AFFINITY,
      now: NOW,
      cityId: 'city_mtl',
    });

    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  it('returns only favorited activities, ranked by the feed engine', async () => {
    const activities = new FakeActivityRepository();
    activities.seed([
      activity({ id: 'a', slug: 'a', isFeatured: false }),
      activity({ id: 'b', slug: 'b', isFeatured: true }),
      activity({ id: 'c', slug: 'c', isFeatured: false }),
    ]);
    const favorites = new FakeFavoriteRepository();
    favorites.seed('user_1', ['a', 'b']);
    const useCase = new ListFavoritesUseCase(favorites, new GetFeedUseCase(activities));

    const result = await useCase.execute({
      userId: 'user_1',
      filters: {},
      cursor: null,
      affinityMap: EMPTY_AFFINITY,
      now: NOW,
      cityId: 'city_mtl',
    });

    expect(result.items.map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('applies user filters on top of the favorites set', async () => {
    const activities = new FakeActivityRepository();
    activities.seed([
      activity({ id: 'a', slug: 'a', kind: 'PLACE' }),
      activity({
        id: 'b',
        slug: 'b',
        kind: 'EVENT',
        dateStart: new Date('2026-06-01T19:00:00.000Z'),
        dateEnd: new Date('2026-06-01T21:00:00.000Z'),
      }),
      activity({ id: 'c', slug: 'c', kind: 'PLACE' }),
    ]);
    const favorites = new FakeFavoriteRepository();
    favorites.seed('user_1', ['a', 'b']);
    const useCase = new ListFavoritesUseCase(favorites, new GetFeedUseCase(activities));

    const result = await useCase.execute({
      userId: 'user_1',
      filters: { kind: 'PLACE' },
      cursor: null,
      affinityMap: EMPTY_AFFINITY,
      now: NOW,
      cityId: 'city_mtl',
    });

    expect(result.items.map((i) => i.id)).toEqual(['a']);
  });
});
