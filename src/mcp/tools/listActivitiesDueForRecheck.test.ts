import { describe, expect, it } from 'vitest';

import type { Activity } from '../../modules/activities/domain/Activity';
import type {
  FreshnessUpdate,
  IActivityIngestionRepository,
} from '../../modules/activities/domain/IActivityIngestionRepository';
import type { City } from '../../modules/activities/domain/City';
import type { ICityRepository } from '../../modules/activities/domain/ICityRepository';
import {
  listActivitiesDueForRecheck,
  listActivitiesDueForRecheckInputSchema,
} from './listActivitiesDueForRecheck';

const NOW = new Date('2026-05-23T12:00:00.000Z');
const VERIFIED = new Date('2026-02-22T12:00:00.000Z');

const MONTREAL: City = {
  id: 'city_mtl',
  slug: 'montreal',
  name: 'Montréal',
  country: 'CA',
  timezone: 'America/Toronto',
  centerLat: 45.5019,
  centerLng: -73.5674,
  bboxMinLat: 45.4,
  bboxMinLng: -73.98,
  bboxMaxLat: 45.71,
  bboxMaxLng: -73.47,
};

function dueActivity(): Activity {
  return {
    ...({} as Activity),
    id: 'activity_1',
    title: 'St-Viateur Bagel',
    kind: 'PLACE',
    address: '263 Rue Saint-Viateur O',
    latitude: 45.5227,
    longitude: -73.6016,
    externalUrl: 'https://www.stviateurbagel.com/',
    lastVerifiedAt: VERIFIED,
  } as Activity;
}

class FakeCityRepository implements ICityRepository {
  constructor(private readonly cities: City[]) {}
  async findById(id: string): Promise<City | null> {
    return this.cities.find((c) => c.id === id) ?? null;
  }
  async findBySlug(slug: string): Promise<City | null> {
    return this.cities.find((c) => c.slug === slug) ?? null;
  }
  async list(): Promise<City[]> {
    return [...this.cities];
  }
}

class FakeIngestion implements IActivityIngestionRepository {
  readonly calls: Array<{ cityId: string; now: Date; limit?: number }> = [];
  constructor(private readonly due: Activity[]) {}
  async findByCityAndDedupeKey(): Promise<Activity | null> {
    return null;
  }
  async refreshFreshness(_id: string, _update: FreshnessUpdate): Promise<void> {}
  async findDueForRecheck(cityId: string, now: Date, limit?: number): Promise<Activity[]> {
    this.calls.push({ cityId, now, limit });
    return this.due;
  }
  async archive(): Promise<void> {}
  async updateImageUrl(): Promise<void> {}
}

describe('listActivitiesDueForRecheck handler', () => {
  it('resolves the city, forwards now + limit, and maps rows to the recheck shape (ISO dates)', async () => {
    const ingestion = new FakeIngestion([dueActivity()]);
    const deps = { cities: new FakeCityRepository([MONTREAL]), ingestion, now: () => NOW };

    const result = await listActivitiesDueForRecheck(deps, { citySlug: 'montreal', limit: 5 });

    expect(ingestion.calls).toEqual([{ cityId: 'city_mtl', now: NOW, limit: 5 }]);
    expect(result).toEqual([
      {
        id: 'activity_1',
        title: 'St-Viateur Bagel',
        kind: 'PLACE',
        address: '263 Rue Saint-Viateur O',
        latitude: 45.5227,
        longitude: -73.6016,
        externalUrl: 'https://www.stviateurbagel.com/',
        lastVerifiedAt: '2026-02-22T12:00:00.000Z',
      },
    ]);
  });

  it('passes limit undefined when omitted', async () => {
    const ingestion = new FakeIngestion([]);
    const deps = { cities: new FakeCityRepository([MONTREAL]), ingestion, now: () => NOW };

    await listActivitiesDueForRecheck(deps, { citySlug: 'montreal' });

    expect(ingestion.calls[0].limit).toBeUndefined();
  });

  it('throws a tool error for an unknown city', async () => {
    const ingestion = new FakeIngestion([]);
    const deps = { cities: new FakeCityRepository([]), ingestion, now: () => NOW };

    await expect(
      listActivitiesDueForRecheck(deps, { citySlug: 'atlantis' }),
    ).rejects.toThrow('Unknown city: atlantis');
  });

  it('Layer A: rejects a non-positive / non-integer limit', () => {
    expect(
      listActivitiesDueForRecheckInputSchema.safeParse({ citySlug: 'montreal', limit: 0 }).success,
    ).toBe(false);
    expect(
      listActivitiesDueForRecheckInputSchema.safeParse({ citySlug: 'montreal', limit: 2.5 }).success,
    ).toBe(false);
  });
});
