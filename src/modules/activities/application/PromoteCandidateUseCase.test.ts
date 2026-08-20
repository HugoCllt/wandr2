import { describe, expect, it } from 'vitest';

import type { Activity, ActivityCreateInput } from '../domain/Activity';
import type { City } from '../domain/City';
import type {
  FreshnessUpdate,
  IActivityIngestionRepository,
} from '../domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../domain/IActivityRepository';
import type { ICandidateRepository } from '../domain/ICandidateRepository';
import type { ICityRepository } from '../domain/ICityRepository';
import type {
  ExtractedActivityPayload,
  RawActivityCandidate,
} from '../domain/RawActivityCandidate';
import { PromoteCandidateUseCase } from './PromoteCandidateUseCase';

const NOW = new Date('2026-05-23T12:00:00.000Z');

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

function payload(overrides: Partial<ExtractedActivityPayload> = {}): ExtractedActivityPayload {
  return {
    title: 'St-Viateur Bagel',
    description: 'Warm bagels in Mile End.',
    imageUrl: 'https://images.unsplash.com/x',
    kind: 'PLACE',
    categories: { primary: 'FOOD', secondary: [] },
    address: '263 Rue Saint-Viateur O, Montreal, QC',
    neighborhood: 'Mile End',
    latitude: 45.5227,
    longitude: -73.6016,
    dateStart: null,
    dateEnd: null,
    priceMinCents: 200,
    priceMaxCents: 2500,
    externalUrl: 'https://www.stviateurbagel.com/',
    indoor: true,
    outdoor: false,
    ...overrides,
  };
}

function candidate(overrides: Partial<RawActivityCandidate> = {}): RawActivityCandidate {
  return {
    id: 'cand_1',
    cityId: 'city_mtl',
    category: 'FOOD',
    agentName: 'food-agent',
    searchQuery: 'best bagels montreal',
    sourceUrl: 'https://example.com',
    rawExcerpt: 'St-Viateur Bagel...',
    extractedPayload: payload(),
    dedupeKey: 'placeholder',
    status: 'PENDING',
    promotedActivityId: null,
    rejectionReason: null,
    createdAt: NOW,
    ...overrides,
  };
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

class FakeCandidateRepository implements ICandidateRepository {
  readonly marks: Array<{ id: string; status: string; ref: string | null }> = [];
  constructor(private readonly candidates: RawActivityCandidate[]) {}
  async create(): Promise<RawActivityCandidate> {
    throw new Error('not used');
  }
  async findById(id: string): Promise<RawActivityCandidate | null> {
    return this.candidates.find((c) => c.id === id) ?? null;
  }
  async markPromoted(id: string, activityId: string): Promise<void> {
    this.marks.push({ id, status: 'PROMOTED', ref: activityId });
  }
  async markDuplicate(id: string, activityId: string): Promise<void> {
    this.marks.push({ id, status: 'DUPLICATE', ref: activityId });
  }
  async markRejected(id: string, reason: string): Promise<void> {
    this.marks.push({ id, status: 'REJECTED', ref: reason });
  }
}

class FakeActivityWriter
  implements
    Pick<IActivityRepository, 'create' | 'getOrCreateSourceIdByName' | 'slugExists'>,
    IActivityIngestionRepository
{
  readonly created: ActivityCreateInput[] = [];
  readonly refreshed: Array<{ id: string; update: FreshnessUpdate }> = [];
  private nextId = 1;
  constructor(private existing: Activity | null = null) {}

  async create(input: ActivityCreateInput): Promise<Activity> {
    this.created.push(input);
    const now = new Date('2026-05-23T12:00:00.000Z');
    return { ...input, id: `activity_${this.nextId++}`, createdAt: now, updatedAt: now };
  }
  async getOrCreateSourceIdByName(): Promise<string> {
    return 'source_agent';
  }
  async slugExists(slug: string): Promise<boolean> {
    return this.existing?.slug === slug;
  }
  async findByCityAndDedupeKey(): Promise<Activity | null> {
    return this.existing;
  }
  async refreshFreshness(id: string, update: FreshnessUpdate): Promise<void> {
    this.refreshed.push({ id, update });
  }
  async findDueForRecheck(): Promise<Activity[]> {
    return [];
  }
  async archive(): Promise<void> {}
  async updateImageUrl(): Promise<void> {}
}

function buildUseCase(opts: {
  candidates: RawActivityCandidate[];
  cities?: City[];
  existing?: Activity | null;
}) {
  const writer = new FakeActivityWriter(opts.existing ?? null);
  const candidatesRepo = new FakeCandidateRepository(opts.candidates);
  const useCase = new PromoteCandidateUseCase(
    writer as unknown as IActivityRepository,
    writer,
    candidatesRepo,
    new FakeCityRepository(opts.cities ?? [MONTREAL]),
  );
  return { useCase, writer, candidatesRepo };
}

describe('PromoteCandidateUseCase', () => {
  it('creates a new PLACE Activity and marks the candidate PROMOTED', async () => {
    const { useCase, writer, candidatesRepo } = buildUseCase({ candidates: [candidate()] });

    const result = await useCase.execute({ candidateId: 'cand_1', now: NOW });

    expect(result.outcome).toBe('PROMOTED');
    expect(writer.created).toHaveLength(1);
    const created = writer.created[0];
    expect(created.cityId).toBe('city_mtl');
    expect(created.status).toBe('PUBLISHED');
    expect(created.dedupeKey).toBe('st-viateur-bagel|45.523,-73.602');
    expect(created.lastSeenAt).toEqual(NOW);
    expect(created.lastVerifiedAt).toEqual(NOW);
    expect(created.expiresAt).toBeNull();
    expect(created.recheckAfter).toEqual(new Date('2026-08-21T12:00:00.000Z'));
    expect(candidatesRepo.marks).toEqual([
      { id: 'cand_1', status: 'PROMOTED', ref: 'activity_1' },
    ]);
  });

  it('refreshes freshness and marks DUPLICATE when an Activity already exists', async () => {
    const existing: Activity = {
      ...({} as Activity),
      id: 'activity_existing',
      slug: 'st-viateur-bagel',
      kind: 'PLACE',
      cityId: 'city_mtl',
      dedupeKey: 'st-viateur-bagel|45.523,-73.602',
    } as Activity;
    const { useCase, writer, candidatesRepo } = buildUseCase({
      candidates: [candidate()],
      existing,
    });

    const result = await useCase.execute({ candidateId: 'cand_1', now: NOW });

    expect(result.outcome).toBe('DUPLICATE');
    expect(writer.created).toHaveLength(0);
    expect(writer.refreshed).toEqual([
      {
        id: 'activity_existing',
        update: {
          lastSeenAt: NOW,
          lastVerifiedAt: NOW,
          recheckAfter: new Date('2026-08-21T12:00:00.000Z'),
        },
      },
    ]);
    expect(candidatesRepo.marks).toEqual([
      { id: 'cand_1', status: 'DUPLICATE', ref: 'activity_existing' },
    ]);
  });

  it('rejects a candidate whose coordinates fall outside the city bbox', async () => {
    const { useCase, writer, candidatesRepo } = buildUseCase({
      candidates: [candidate({ extractedPayload: payload({ latitude: 48.0, longitude: -71.0 }) })],
    });

    const result = await useCase.execute({ candidateId: 'cand_1', now: NOW });

    expect(result.outcome).toBe('REJECTED');
    expect(writer.created).toHaveLength(0);
    expect(candidatesRepo.marks[0].status).toBe('REJECTED');
  });

  it('rejects a structurally invalid payload (empty title)', async () => {
    const { useCase, candidatesRepo } = buildUseCase({
      candidates: [candidate({ extractedPayload: payload({ title: '' }) })],
    });

    const result = await useCase.execute({ candidateId: 'cand_1', now: NOW });

    expect(result.outcome).toBe('REJECTED');
    expect(candidatesRepo.marks[0].status).toBe('REJECTED');
  });
});
