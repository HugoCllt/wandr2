import { describe, expect, it } from 'vitest';

import { ActivityNotFoundError } from '../domain/ActivityNotFoundError';
import type { Activity, ActivityCreateInput } from '../domain/Activity';
import type { IActivityRepository } from '../domain/IActivityRepository';
import { GetActivityUseCase } from './GetActivityUseCase';

class FakeActivityRepository implements IActivityRepository {
  private readonly bySlug = new Map<string, Activity>();
  private readonly sources = new Map<string, string>();
  private nextActivityId = 1;
  private nextSourceId = 1;

  seed(activity: Activity): void {
    this.bySlug.set(activity.slug, activity);
  }

  async create(input: ActivityCreateInput): Promise<Activity> {
    const now = new Date('2026-05-06T00:00:00.000Z');
    const activity: Activity = {
      ...input,
      id: `activity_${this.nextActivityId++}`,
      createdAt: now,
      updatedAt: now,
    };
    this.bySlug.set(activity.slug, activity);
    return activity;
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

  async findCandidates(): Promise<Activity[]> {
    return Array.from(this.bySlug.values());
  }

  async getOrCreateSourceIdByName(name: string): Promise<string> {
    const existing = this.sources.get(name);
    if (existing) return existing;
    const id = `source_${this.nextSourceId++}`;
    this.sources.set(name, id);
    return id;
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

function activityFixture(overrides: Partial<Activity> = {}): Activity {
  const createdAt = new Date('2026-05-01T00:00:00.000Z');
  return {
    id: 'activity_1',
    slug: 'mural-festival',
    title: 'MURAL Festival',
    description: 'Public art and music on Saint-Laurent.',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205',
    imageCredit: 'Photo on Unsplash',
    kind: 'EVENT',
    category: 'CULTURE',
    address: 'Saint-Laurent Boulevard, Montreal',
    neighborhood: 'Plateau-Mont-Royal',
    latitude: 45.516,
    longitude: -73.583,
    dateStart: new Date('2026-06-15T19:00:00.000Z'),
    dateEnd: new Date('2026-06-15T21:00:00.000Z'),
    priceMinCents: 0,
    priceMaxCents: 2500,
    externalUrl: 'https://example.com/mural',
    indoor: false,
    outdoor: true,
    isFeatured: true,
    status: 'PUBLISHED',
    sourceId: 'source_1',
    externalId: 'event_mural',
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

describe('GetActivityUseCase', () => {
  it('returns the activity when the slug exists', async () => {
    const repo = new FakeActivityRepository();
    const seeded = activityFixture();
    repo.seed(seeded);

    const useCase = new GetActivityUseCase(repo);
    const found = await useCase.execute('mural-festival');

    expect(found).toEqual(seeded);
  });

  it('throws ActivityNotFoundError when the slug is unknown', async () => {
    const repo = new FakeActivityRepository();
    const useCase = new GetActivityUseCase(repo);

    await expect(useCase.execute('does-not-exist')).rejects.toBeInstanceOf(ActivityNotFoundError);
  });
});
