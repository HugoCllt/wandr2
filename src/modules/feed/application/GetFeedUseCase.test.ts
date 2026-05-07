import { describe, expect, it } from 'vitest';

import type {
  Activity,
  ActivityCategory,
  ActivityCreateInput,
} from '../../activities/domain/Activity';
import type { ActivityCandidateCriteria } from '../../activities/domain/ActivityCandidateCriteria';
import type { IActivityRepository } from '../../activities/domain/IActivityRepository';
import { GetFeedUseCase } from './GetFeedUseCase';

const NOW = new Date('2026-05-06T12:00:00.000Z');

class FakeActivityRepository implements IActivityRepository {
  private readonly bySlug = new Map<string, Activity>();

  seed(activities: Activity[]): void {
    for (const a of activities) this.bySlug.set(a.slug, a);
  }

  async create(_input: ActivityCreateInput): Promise<Activity> {
    throw new Error('not used in feed tests');
  }

  async findBySlug(slug: string): Promise<Activity | null> {
    return this.bySlug.get(slug) ?? null;
  }

  async findCandidates(criteria: ActivityCandidateCriteria): Promise<Activity[]> {
    const all = Array.from(this.bySlug.values());
    return all.filter((a) => {
      if (a.status !== criteria.status) return false;
      if (criteria.kinds && !criteria.kinds.includes(a.kind)) return false;
      if (criteria.categories && !criteria.categories.includes(a.category)) return false;
      if (criteria.neighborhoods) {
        if (!a.neighborhood || !criteria.neighborhoods.includes(a.neighborhood)) return false;
      }
      if (criteria.priceMaxCents !== undefined && a.priceMinCents > criteria.priceMaxCents) {
        return false;
      }
      if (criteria.indoor === true && a.indoor !== true) return false;
      if (criteria.outdoor === true && a.outdoor !== true) return false;
      if (criteria.free === true && a.priceMinCents !== 0) return false;
      if (criteria.paid === true && a.priceMinCents <= 0) return false;
      if (criteria.eventDateWindow) {
        const window = criteria.eventDateWindow;
        if (a.kind === 'EVENT') {
          if (!a.dateStart) return false;
          const t = a.dateStart.getTime();
          if (t < window.from.getTime() || t > window.to.getTime()) return false;
        }
        // PLACE always passes the date window per Q7.
      }
      return true;
    });
  }

  async getOrCreateSourceIdByName(_name: string): Promise<string> {
    return 'source_1';
  }

  async slugExists(slug: string): Promise<boolean> {
    return this.bySlug.has(slug);
  }

  async listNeighborhoods(): Promise<string[]> {
    const set = new Set<string>();
    for (const a of this.bySlug.values()) {
      if (a.neighborhood) set.add(a.neighborhood);
    }
    return Array.from(set).sort();
  }

  async listFeatured(limit: number): Promise<Activity[]> {
    return Array.from(this.bySlug.values())
      .filter((a) => a.isFeatured)
      .slice(0, limit);
  }
}

let nextActivityCounter = 1;

function activity(overrides: Partial<Activity>): Activity {
  const id = overrides.id ?? `activity_${nextActivityCounter++}`;
  const createdAt = overrides.createdAt ?? new Date('2026-04-01T00:00:00.000Z');
  return {
    id,
    slug: overrides.slug ?? id,
    title: 'Activity',
    description: 'Description',
    imageUrl: 'https://images.unsplash.com/x',
    imageCredit: 'Photo on Unsplash',
    kind: 'PLACE',
    category: 'CULTURE',
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
    externalId: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

const EMPTY_AFFINITY: Map<ActivityCategory, number> = new Map();

describe('GetFeedUseCase', () => {
  it('returns an empty result with null cursor when no candidates exist', async () => {
    const repo = new FakeActivityRepository();
    const useCase = new GetFeedUseCase(repo);

    const result = await useCase.execute({
      filters: {},
      cursor: null,
      affinityMap: EMPTY_AFFINITY,
      now: NOW,
    });

    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  it('returns ranked items respecting featured and matchScore', async () => {
    const repo = new FakeActivityRepository();
    repo.seed([
      activity({ id: 'a', slug: 'a', category: 'FOOD', isFeatured: false }),
      activity({ id: 'b', slug: 'b', category: 'SPORT', isFeatured: true }),
      activity({ id: 'c', slug: 'c', category: 'NIGHTLIFE', isFeatured: false }),
    ]);
    const aff = new Map<ActivityCategory, number>([
      ['FOOD', 9],
      ['SPORT', 1],
      ['NIGHTLIFE', 5],
    ]);
    const useCase = new GetFeedUseCase(repo);

    const result = await useCase.execute({
      filters: {},
      cursor: null,
      affinityMap: aff,
      now: NOW,
    });

    expect(result.items.map((i) => i.id)).toEqual(['b', 'a', 'c']);
  });

  it('paginates with cursor: page 2 starts after the last item of page 1', async () => {
    const repo = new FakeActivityRepository();
    const items = Array.from({ length: 5 }).map((_, i) =>
      activity({
        id: `a${i}`,
        slug: `a${i}`,
        createdAt: new Date(`2026-04-0${i + 1}T00:00:00.000Z`),
        updatedAt: new Date(`2026-04-0${i + 1}T00:00:00.000Z`),
      }),
    );
    repo.seed(items);
    const useCase = new GetFeedUseCase(repo);

    const page1 = await useCase.execute({
      filters: {},
      cursor: null,
      limit: 2,
      affinityMap: EMPTY_AFFINITY,
      now: NOW,
    });
    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await useCase.execute({
      filters: {},
      cursor: page1.nextCursor,
      limit: 2,
      affinityMap: EMPTY_AFFINITY,
      now: NOW,
    });
    expect(page2.items).toHaveLength(2);
    const seenIds = new Set([...page1.items.map((i) => i.id), ...page2.items.map((i) => i.id)]);
    expect(seenIds.size).toBe(4);
    expect(page2.nextCursor).not.toBeNull();

    const page3 = await useCase.execute({
      filters: {},
      cursor: page2.nextCursor,
      limit: 2,
      affinityMap: EMPTY_AFFINITY,
      now: NOW,
    });
    expect(page3.items).toHaveLength(1);
    expect(page3.nextCursor).toBeNull();
  });

  it('composes preset baseFilters with user filters (override wins)', async () => {
    const repo = new FakeActivityRepository();
    repo.seed([
      activity({
        id: 'event',
        slug: 'event',
        kind: 'EVENT',
        dateStart: new Date('2026-06-01T19:00:00.000Z'),
        dateEnd: new Date('2026-06-01T21:00:00.000Z'),
      }),
      activity({ id: 'place', slug: 'place', kind: 'PLACE' }),
    ]);
    const useCase = new GetFeedUseCase(repo);

    const result = await useCase.execute({
      filters: { kind: 'PLACE' },
      cursor: null,
      affinityMap: EMPTY_AFFINITY,
      now: NOW,
      baseFilters: { kind: 'EVENT' },
    });

    expect(result.items.map((i) => i.id)).toEqual(['place']);
  });

  it('kind=EVENT filter excludes PLACEs', async () => {
    const repo = new FakeActivityRepository();
    repo.seed([
      activity({
        id: 'e1',
        slug: 'e1',
        kind: 'EVENT',
        dateStart: new Date('2026-06-01T19:00:00.000Z'),
        dateEnd: new Date('2026-06-01T21:00:00.000Z'),
      }),
      activity({ id: 'p1', slug: 'p1', kind: 'PLACE' }),
      activity({ id: 'p2', slug: 'p2', kind: 'PLACE' }),
    ]);
    const useCase = new GetFeedUseCase(repo);

    const result = await useCase.execute({
      filters: { kind: 'EVENT' },
      cursor: null,
      affinityMap: EMPTY_AFFINITY,
      now: NOW,
    });

    expect(result.items.every((i) => i.kind === 'EVENT')).toBe(true);
    expect(result.items.map((i) => i.id)).toEqual(['e1']);
  });

  it('date range filter keeps all PLACEs and only matching EVENTs (Q7)', async () => {
    const repo = new FakeActivityRepository();
    repo.seed([
      activity({
        id: 'e_in',
        slug: 'e_in',
        kind: 'EVENT',
        dateStart: new Date('2026-06-13T20:00:00.000Z'),
        dateEnd: new Date('2026-06-13T23:00:00.000Z'),
      }),
      activity({
        id: 'e_out',
        slug: 'e_out',
        kind: 'EVENT',
        dateStart: new Date('2026-08-01T20:00:00.000Z'),
        dateEnd: new Date('2026-08-01T23:00:00.000Z'),
      }),
      activity({ id: 'p1', slug: 'p1', kind: 'PLACE' }),
      activity({ id: 'p2', slug: 'p2', kind: 'PLACE' }),
    ]);
    const useCase = new GetFeedUseCase(repo);

    const result = await useCase.execute({
      filters: { date: { from: '2026-06-13', to: '2026-06-14' } },
      cursor: null,
      affinityMap: EMPTY_AFFINITY,
      now: NOW,
    });

    const ids = result.items.map((i) => i.id).sort();
    expect(ids).toEqual(['e_in', 'p1', 'p2']);
  });

  it('treats invalid cursor as start (no items skipped)', async () => {
    const repo = new FakeActivityRepository();
    repo.seed([activity({ id: 'a', slug: 'a' }), activity({ id: 'b', slug: 'b' })]);
    const useCase = new GetFeedUseCase(repo);

    const result = await useCase.execute({
      filters: {},
      cursor: 'garbage-not-base64',
      affinityMap: EMPTY_AFFINITY,
      now: NOW,
    });

    expect(result.items).toHaveLength(2);
  });
});
