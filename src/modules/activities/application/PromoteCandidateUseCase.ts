import { createActivity, type ActivityCreateInput } from '../domain/Activity';
import { isWithinCityBbox } from '../domain/City';
import { computeDedupeKey } from '../domain/computeDedupeKey';
import { computeExpiresAt, computeRecheckAfter } from '../domain/freshness';
import type { IActivityIngestionRepository } from '../domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../domain/IActivityRepository';
import type { ICandidateRepository } from '../domain/ICandidateRepository';
import type { ICityRepository } from '../domain/ICityRepository';
import type {
  ExtractedActivityPayload,
  RawActivityCandidate,
} from '../domain/RawActivityCandidate';
import { slugify } from '../domain/slug';

export type PromotionOutcome = 'PROMOTED' | 'DUPLICATE' | 'REJECTED';

export type PromotionResult = {
  outcome: PromotionOutcome;
  activityId: string | null;
  reason: string | null;
};

export type PromoteCandidateInput = {
  candidateId: string;
  now: Date;
};

export class PromoteCandidateUseCase {
  constructor(
    private readonly activities: IActivityRepository,
    private readonly ingestion: IActivityIngestionRepository,
    private readonly candidates: ICandidateRepository,
    private readonly cities: ICityRepository,
  ) {}

  async execute(input: PromoteCandidateInput): Promise<PromotionResult> {
    const candidate = await this.candidates.findById(input.candidateId);
    if (!candidate) {
      throw new Error(`Candidate ${input.candidateId} not found.`);
    }

    const city = await this.cities.findById(candidate.cityId);
    if (!city) {
      return this.reject(candidate.id, `Unknown city ${candidate.cityId}.`);
    }

    const payload = candidate.extractedPayload;
    if (!isWithinCityBbox(city, payload.latitude, payload.longitude)) {
      return this.reject(candidate.id, 'Coordinates outside city bbox.');
    }

    const dateStart = payload.dateStart ? new Date(payload.dateStart) : null;
    const dateEnd = payload.dateEnd ? new Date(payload.dateEnd) : null;

    let dedupeKey: string;
    let baseInput: Omit<ActivityCreateInput, 'slug'>;
    try {
      dedupeKey = computeDedupeKey({
        kind: payload.kind,
        title: payload.title,
        dateStart,
        latitude: payload.latitude,
        longitude: payload.longitude,
      });
      baseInput = {
        title: payload.title,
        description: payload.description,
        imageUrl: payload.imageUrl,
        kind: payload.kind,
        categories: payload.categories,
        address: payload.address,
        neighborhood: payload.neighborhood,
        latitude: payload.latitude,
        longitude: payload.longitude,
        dateStart,
        dateEnd,
        priceMinCents: payload.priceMinCents,
        priceMaxCents: payload.priceMaxCents,
        externalUrl: payload.externalUrl,
        indoor: payload.indoor,
        outdoor: payload.outdoor,
        isFeatured: false,
        status: 'PUBLISHED',
        sourceId: '', // resolved below for the create branch
        cityId: city.id,
        dedupeKey,
        expiresAt: computeExpiresAt({ kind: payload.kind, dateEnd }),
        lastSeenAt: input.now,
        lastVerifiedAt: input.now,
        recheckAfter: computeRecheckAfter({ kind: payload.kind, lastSeenAt: input.now }),
      };
    } catch (error) {
      return this.reject(candidate.id, messageOf(error));
    }

    const existing = await this.ingestion.findByCityAndDedupeKey(city.id, dedupeKey);
    if (existing) {
      await this.ingestion.refreshFreshness(existing.id, {
        lastSeenAt: input.now,
        lastVerifiedAt: input.now,
        recheckAfter: computeRecheckAfter({ kind: existing.kind, lastSeenAt: input.now }),
      });
      await this.candidates.markDuplicate(candidate.id, existing.id);
      return { outcome: 'DUPLICATE', activityId: existing.id, reason: null };
    }

    let created;
    try {
      const sourceId = await this.activities.getOrCreateSourceIdByName(candidate.agentName);
      const slug = await this.uniqueSlug(payload.title);
      created = await this.activities.create(
        createActivity({ ...baseInput, sourceId, slug }),
      );
    } catch (error) {
      return this.reject(candidate.id, messageOf(error));
    }

    await this.candidates.markPromoted(candidate.id, created.id);
    return { outcome: 'PROMOTED', activityId: created.id, reason: null };
  }

  private async reject(candidateId: string, reason: string): Promise<PromotionResult> {
    await this.candidates.markRejected(candidateId, reason);
    return { outcome: 'REJECTED', activityId: null, reason };
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    let candidate = base;
    let suffix = 2;
    while (await this.activities.slugExists(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export type { ExtractedActivityPayload, RawActivityCandidate };
