import { describe, expect, it } from 'vitest';

import { PromoteCandidateUseCase } from '../../modules/activities/application/PromoteCandidateUseCase';
import type { Activity, ActivityCreateInput } from '../../modules/activities/domain/Activity';
import type { City } from '../../modules/activities/domain/City';
import type {
  FreshnessUpdate,
  IActivityIngestionRepository,
} from '../../modules/activities/domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../../modules/activities/domain/IActivityRepository';
import type { ICandidateRepository } from '../../modules/activities/domain/ICandidateRepository';
import type { ICityRepository } from '../../modules/activities/domain/ICityRepository';
import type {
  ExtractedActivityPayload,
  RawActivityCandidate,
  RawActivityCandidateCreateInput,
} from '../../modules/activities/domain/RawActivityCandidate';
import { ingestActivity, ingestActivityInputSchema } from './ingestActivity';

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
    imageUrl: 'https://images.example.com/bagel.jpg',
    imageCredit: null,
    kind: 'PLACE',
    category: 'FOOD',
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
    tags: ['FOOD'],
    ...overrides,
  };
}

function meta(overrides: Record<string, unknown> = {}) {
  return {
    agentName: 'food-agent',
    searchQuery: 'best bagels montreal',
    sourceUrl: 'https://example.com/article',
    rawExcerpt: 'St-Viateur Bagel is a Montreal institution...',
    category: 'FOOD' as const,
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
}

class FakeCandidateRepository implements ICandidateRepository {
  readonly created: RawActivityCandidateCreateInput[] = [];
  readonly marks: Array<{ id: string; status: string; ref: string | null }> = [];
  private readonly store = new Map<string, RawActivityCandidate>();
  private n = 1;
  async create(input: RawActivityCandidateCreateInput): Promise<RawActivityCandidate> {
    this.created.push(input);
    const candidate: RawActivityCandidate = {
      ...input,
      id: `cand_${this.n++}`,
      status: 'PENDING',
      promotedActivityId: null,
      rejectionReason: null,
      createdAt: NOW,
    };
    this.store.set(candidate.id, candidate);
    return candidate;
  }
  async findById(id: string): Promise<RawActivityCandidate | null> {
    return this.store.get(id) ?? null;
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
    Pick<IActivityRepository, 'create' | 'getOrCreateSourceIdByName' | 'slugExists' | 'findById'>,
    IActivityIngestionRepository
{
  readonly created: ActivityCreateInput[] = [];
  readonly refreshed: Array<{ id: string; update: FreshnessUpdate }> = [];
  private n = 1;
  constructor(private readonly existing: Activity | null = null) {}
  async create(input: ActivityCreateInput): Promise<Activity> {
    this.created.push(input);
    return { ...input, id: `activity_${this.n++}`, createdAt: NOW, updatedAt: NOW };
  }
  async getOrCreateSourceIdByName(): Promise<string> {
    return 'source_agent';
  }
  async slugExists(slug: string): Promise<boolean> {
    return this.existing?.slug === slug;
  }
  async findById(id: string): Promise<Activity | null> {
    return this.existing?.id === id ? this.existing : null;
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
}

function build(opts: { cities?: City[]; existing?: Activity | null } = {}) {
  const cities = new FakeCityRepository(opts.cities ?? [MONTREAL]);
  const candidates = new FakeCandidateRepository();
  const writer = new FakeActivityWriter(opts.existing ?? null);
  const promote = new PromoteCandidateUseCase(
    writer as unknown as IActivityRepository,
    writer,
    candidates,
    cities,
  );
  const deps = { cities, candidates, promote, now: () => NOW };
  return { deps, cities, candidates, writer };
}

describe('ingestActivity handler', () => {
  it('PROMOTED: stages the candidate (meta.category + placeholder key) and creates the activity', async () => {
    const { deps, candidates, writer } = build();

    const result = await ingestActivity(deps, {
      citySlug: 'montreal',
      payload: payload(),
      meta: meta(),
    });

    expect(result).toEqual({ outcome: 'PROMOTED', activityId: 'activity_1', reason: null });
    expect(candidates.created).toHaveLength(1);
    expect(candidates.created[0].category).toBe('FOOD');
    expect(candidates.created[0].dedupeKey).toBe('pending-promotion');
    expect(candidates.created[0].cityId).toBe('city_mtl');
    expect(writer.created).toHaveLength(1);
    expect(writer.created[0].category).toBe('FOOD');
  });

  it('DUPLICATE: refreshes the existing activity instead of creating one', async () => {
    const existing: Activity = {
      ...({} as Activity),
      id: 'activity_existing',
      slug: 'st-viateur-bagel',
      kind: 'PLACE',
      cityId: 'city_mtl',
      dedupeKey: 'st-viateur-bagel|45.523,-73.602',
    } as Activity;
    const { deps, writer } = build({ existing });

    const result = await ingestActivity(deps, {
      citySlug: 'montreal',
      payload: payload(),
      meta: meta(),
    });

    expect(result).toEqual({ outcome: 'DUPLICATE', activityId: 'activity_existing', reason: null });
    expect(writer.created).toHaveLength(0);
    expect(writer.refreshed).toHaveLength(1);
  });

  it('REJECTED: a well-typed payload outside the city bbox returns a reason, not a tool error', async () => {
    const { deps, writer } = build();

    const result = await ingestActivity(deps, {
      citySlug: 'montreal',
      payload: payload({ latitude: 48.0, longitude: -71.0 }),
      meta: meta(),
    });

    expect(result.outcome).toBe('REJECTED');
    expect(result.activityId).toBeNull();
    expect(result.reason).toMatch(/bbox/i);
    expect(writer.created).toHaveLength(0);
  });

  it('Unknown city: REJECTED with reason and NO candidate created', async () => {
    const { deps, candidates } = build({ cities: [] });

    const result = await ingestActivity(deps, {
      citySlug: 'montreal',
      payload: payload(),
      meta: meta(),
    });

    expect(result).toEqual({
      outcome: 'REJECTED',
      activityId: null,
      reason: 'Unknown city: montreal',
    });
    expect(candidates.created).toHaveLength(0);
  });

  it('Layer A: a structurally invalid payload (latitude as string) fails Zod parsing', () => {
    const parsed = ingestActivityInputSchema.safeParse({
      citySlug: 'montreal',
      payload: { ...payload(), latitude: '45.5' },
      meta: meta(),
    });

    expect(parsed.success).toBe(false);
  });

  it('Layer A: optional payload fields may be omitted and default to null', () => {
    const parsed = ingestActivityInputSchema.safeParse({
      citySlug: 'montreal',
      payload: {
        title: 'St-Viateur Bagel',
        description: 'Warm bagels.',
        kind: 'PLACE',
        category: 'FOOD',
        address: '263 Rue Saint-Viateur O',
        latitude: 45.5227,
        longitude: -73.6016,
        priceMinCents: 200,
        indoor: true,
        outdoor: false,
        tags: ['FOOD'],
      },
      meta: meta(),
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.payload.imageUrl).toBeNull();
      expect(parsed.data.payload.dateStart).toBeNull();
      expect(parsed.data.payload.imageCredit).toBeNull();
      expect(parsed.data.payload.priceMaxCents).toBeNull();
    }
  });

  it('PROMOTED: an activity with no image (imageUrl omitted) is still created', async () => {
    const { deps, writer } = build();

    const result = await ingestActivity(deps, {
      citySlug: 'montreal',
      payload: payload({ imageUrl: null }),
      meta: meta(),
    });

    expect(result.outcome).toBe('PROMOTED');
    expect(writer.created).toHaveLength(1);
    expect(writer.created[0].imageUrl).toBeNull();
  });
});
