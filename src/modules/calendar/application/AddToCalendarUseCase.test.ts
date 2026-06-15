import { describe, expect, it } from 'vitest';

import type { Activity, ActivityCreateInput } from '../../activities/domain/Activity';
import { ActivityNotFoundError } from '../../activities/domain/ActivityNotFoundError';
import type { IActivityRepository } from '../../activities/domain/IActivityRepository';
import { DuplicateCalendarEntryError } from '../domain/DuplicateCalendarEntryError';
import { AddToCalendarUseCase } from './AddToCalendarUseCase';
import { FakeCalendarRepository } from './testFakes';

class FakeActivityRepository implements IActivityRepository {
  private readonly byId = new Map<string, Activity>();

  seed(activity: Activity): void {
    this.byId.set(activity.id, activity);
  }

  async create(_input: ActivityCreateInput): Promise<Activity> {
    throw new Error('not used');
  }
  async findBySlug(_slug: string): Promise<Activity | null> {
    return null;
  }
  async findById(id: string): Promise<Activity | null> {
    return this.byId.get(id) ?? null;
  }
  async findByIds(ids: ReadonlyArray<string>): Promise<Activity[]> {
    return ids.map((id) => this.byId.get(id)).filter((a): a is Activity => a !== undefined);
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

function activityFixture(overrides: Partial<Activity> = {}): Activity {
  const now = new Date('2026-04-01T00:00:00.000Z');
  return {
    id: 'activity_1',
    slug: 'demo',
    title: 'Demo',
    description: 'desc',
    imageUrl: 'https://example.com/x.jpg',
    kind: 'PLACE',
    categories: { primary: 'FOOD', secondary: [] },
    address: '1 rue',
    neighborhood: null,
    latitude: 0,
    longitude: 0,
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
    dedupeKey: 'demo|0.000,0.000',
    expiresAt: null,
    lastSeenAt: now,
    lastVerifiedAt: null,
    recheckAfter: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('AddToCalendarUseCase', () => {
  it('adds a new entry and returns it', async () => {
    const calendar = new FakeCalendarRepository();
    const activities = new FakeActivityRepository();
    activities.seed(activityFixture({ id: 'activity_1' }));
    const useCase = new AddToCalendarUseCase(calendar, activities);

    const entry = await useCase.execute({
      userId: 'user_1',
      activityId: 'activity_1',
      scheduledAt: new Date('2026-06-15T19:30:00Z'),
      notes: 'Bring scarf',
    });

    expect(entry.id).toMatch(/^entry_/);
    expect(entry.userId).toBe('user_1');
    expect(entry.scheduledAt.toISOString()).toBe('2026-06-15T19:30:00.000Z');
    expect(entry.notes).toBe('Bring scarf');
    expect(calendar.entries).toHaveLength(1);
  });

  it('accepts a past scheduledAt (journal usage)', async () => {
    const calendar = new FakeCalendarRepository();
    const activities = new FakeActivityRepository();
    activities.seed(activityFixture({ id: 'activity_1' }));
    const useCase = new AddToCalendarUseCase(calendar, activities);

    const entry = await useCase.execute({
      userId: 'user_1',
      activityId: 'activity_1',
      scheduledAt: new Date('2020-02-15T20:00:00Z'),
    });

    expect(entry.scheduledAt.getFullYear()).toBe(2020);
  });

  it('throws DuplicateCalendarEntryError for an already-bookmarked activity', async () => {
    const calendar = new FakeCalendarRepository();
    const activities = new FakeActivityRepository();
    activities.seed(activityFixture({ id: 'activity_1' }));
    const useCase = new AddToCalendarUseCase(calendar, activities);

    await useCase.execute({
      userId: 'user_1',
      activityId: 'activity_1',
      scheduledAt: new Date('2026-06-15T19:30:00Z'),
    });
    // One signet per activity: re-bookmarking (even at a different time) is a duplicate.
    await expect(
      useCase.execute({
        userId: 'user_1',
        activityId: 'activity_1',
        scheduledAt: new Date('2026-07-20T19:30:00Z'),
      }),
    ).rejects.toBeInstanceOf(DuplicateCalendarEntryError);
    expect(calendar.entries).toHaveLength(1);
  });

  it('throws ActivityNotFoundError when the activity does not exist', async () => {
    const calendar = new FakeCalendarRepository();
    const activities = new FakeActivityRepository();
    const useCase = new AddToCalendarUseCase(calendar, activities);

    await expect(
      useCase.execute({
        userId: 'user_1',
        activityId: 'unknown',
        scheduledAt: new Date('2026-06-15T19:30:00Z'),
      }),
    ).rejects.toBeInstanceOf(ActivityNotFoundError);
    expect(calendar.entries).toHaveLength(0);
  });
});
