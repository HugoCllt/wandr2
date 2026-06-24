import { describe, expect, it } from 'vitest';

import type { Activity, ActivityCategory, ActivityCreateInput } from '../../activities/domain/Activity';
import type { IActivityRepository } from '../../activities/domain/IActivityRepository';
import type { IAffinityRepository } from '../../affinity/domain/IAffinityRepository';
import type { UserCategoryAffinity } from '../../affinity/domain/UserCategoryAffinity';
import { CalendarEntryNotFoundError } from '../domain/CalendarEntryNotFoundError';
import { ReviewCalendarEntryUseCase } from './ReviewCalendarEntryUseCase';
import { FakeCalendarRepository } from './testFakes';

class FakeAffinityRepository implements IAffinityRepository {
  readonly scores = new Map<ActivityCategory, number>();

  seed(category: ActivityCategory, score: number): void {
    this.scores.set(category, score);
  }

  async listByUserId(): Promise<UserCategoryAffinity[]> {
    return [];
  }
  async getScoreMap(): Promise<Map<ActivityCategory, number>> {
    return new Map(this.scores);
  }
  async adjustScore(_userId: string, category: ActivityCategory, delta: number): Promise<number> {
    const next = Math.max(0, Math.min(10, Math.round((this.scores.get(category) ?? 5) + delta)));
    this.scores.set(category, next);
    return next;
  }
}

class FakeActivityRepository implements IActivityRepository {
  private readonly byId = new Map<string, Activity>();
  seed(activity: Activity): void {
    this.byId.set(activity.id, activity);
  }
  async create(_input: ActivityCreateInput): Promise<Activity> {
    throw new Error('not used');
  }
  async findBySlug(): Promise<Activity | null> {
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

function activityFixture(primary: ActivityCategory): Activity {
  const now = new Date('2026-04-01T00:00:00.000Z');
  return {
    id: 'activity_1',
    slug: 'demo',
    title: 'Demo',
    description: 'desc',
    imageUrl: null,
    kind: 'PLACE',
    categories: { primary, secondary: [] },
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
  };
}

async function bookmark(calendar: FakeCalendarRepository): Promise<string> {
  const entry = await calendar.add({
    userId: 'user_1',
    activityId: 'activity_1',
    scheduledAt: new Date('2026-05-01T19:00:00Z'),
  });
  return entry.id;
}

describe('ReviewCalendarEntryUseCase', () => {
  it('marks DONE and lifts the primary category affinity (more when satisfaction is high)', async () => {
    const calendar = new FakeCalendarRepository();
    const affinities = new FakeAffinityRepository();
    affinities.seed('FOOD', 5);
    const activities = new FakeActivityRepository();
    activities.seed(activityFixture('FOOD'));
    const id = await bookmark(calendar);
    const useCase = new ReviewCalendarEntryUseCase(calendar, activities, affinities);

    const entry = await useCase.execute({
      userId: 'user_1',
      entryId: id,
      outcome: 'DONE',
      satisfaction: 5,
      reviewNote: 'Loved it',
    });

    expect(entry.outcome).toBe('DONE');
    expect(entry.satisfaction).toBe(5);
    expect(affinities.scores.get('FOOD')).toBe(7); // +2 for satisfaction >= 4
  });

  it('lifts by 1 for a modest DONE rating', async () => {
    const calendar = new FakeCalendarRepository();
    const affinities = new FakeAffinityRepository();
    affinities.seed('CULTURE', 6);
    const activities = new FakeActivityRepository();
    activities.seed(activityFixture('CULTURE'));
    const id = await bookmark(calendar);
    const useCase = new ReviewCalendarEntryUseCase(calendar, activities, affinities);

    await useCase.execute({ userId: 'user_1', entryId: id, outcome: 'DONE', satisfaction: 2 });

    expect(affinities.scores.get('CULTURE')).toBe(7);
  });

  it('marks MISSED and nudges the primary category affinity down', async () => {
    const calendar = new FakeCalendarRepository();
    const affinities = new FakeAffinityRepository();
    affinities.seed('NIGHTLIFE', 4);
    const activities = new FakeActivityRepository();
    activities.seed(activityFixture('NIGHTLIFE'));
    const id = await bookmark(calendar);
    const useCase = new ReviewCalendarEntryUseCase(calendar, activities, affinities);

    await useCase.execute({ userId: 'user_1', entryId: id, outcome: 'MISSED' });

    expect(affinities.scores.get('NIGHTLIFE')).toBe(3);
  });

  it('throws when the entry does not belong to the user', async () => {
    const calendar = new FakeCalendarRepository();
    const affinities = new FakeAffinityRepository();
    const activities = new FakeActivityRepository();
    activities.seed(activityFixture('FOOD'));
    await bookmark(calendar);
    const useCase = new ReviewCalendarEntryUseCase(calendar, activities, affinities);

    await expect(
      useCase.execute({ userId: 'someone_else', entryId: 'entry_1', outcome: 'MISSED' }),
    ).rejects.toBeInstanceOf(CalendarEntryNotFoundError);
  });
});
