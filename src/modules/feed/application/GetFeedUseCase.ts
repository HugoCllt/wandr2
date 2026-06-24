import type { Activity, ActivityCategory } from '../../activities/domain/Activity';
import type { ActivityCandidateCriteria } from '../../activities/domain/ActivityCandidateCriteria';
import type { IActivityRepository } from '../../activities/domain/IActivityRepository';
import type { FilterValue } from '../../filters/domain/FilterValue';
import { DEFAULT_FEED_LIMIT, type FeedResult, type RankedActivity } from '../domain/FeedQuery';
import { decodeCursor, encodeCursor, type FeedCursorKey } from './cursor-codec';
import { resolveEventDateWindow } from './dateWindow';
import { rank } from './ranking/p1';

const CENTS_PER_DOLLAR = 100;

export type GetFeedInput = {
  filters: FilterValue;
  cursor: string | null;
  limit?: number;
  affinityMap: Map<ActivityCategory, number>;
  now: Date;
  cityId: string;
  baseFilters?: FilterValue;
  activityIds?: string[];
};

export class GetFeedUseCase {
  constructor(private readonly activities: IActivityRepository) {}

  async execute(input: GetFeedInput): Promise<FeedResult> {
    const limit = input.limit ?? DEFAULT_FEED_LIMIT;
    const merged = mergeFilters(input.baseFilters ?? {}, input.filters);
    const criteria = toCriteria(merged, input.now, input.cityId);
    if (input.activityIds !== undefined) {
      criteria.activityIds = input.activityIds;
    }

    const candidates = await this.activities.findCandidates(criteria);
    const ranked = rank(candidates, input.affinityMap, input.now);

    const decoded = decodeCursor(input.cursor);
    const startIdx = decoded ? findStartIndexAfter(ranked, decoded) : 0;
    const items = ranked.slice(startIdx, startIdx + limit);
    const consumed = startIdx + items.length;
    const nextCursor =
      items.length > 0 && consumed < ranked.length
        ? encodeCursor(toCursorKey(items[items.length - 1]))
        : null;

    return { items, nextCursor };
  }
}

function mergeFilters(base: FilterValue, override: FilterValue): FilterValue {
  return { ...base, ...override };
}

function toCriteria(filters: FilterValue, now: Date, cityId: string): ActivityCandidateCriteria {
  const criteria: ActivityCandidateCriteria = {
    status: 'PUBLISHED',
    cityId,
    notExpiredAsOf: now,
  };

  if (filters.kind) criteria.kinds = [filters.kind];
  if (filters.category && filters.category.length > 0) criteria.categories = filters.category;
  if (filters.neighborhood && filters.neighborhood.length > 0) {
    criteria.neighborhoods = filters.neighborhood;
  }
  if (filters.priceMax !== undefined) {
    criteria.priceMaxCents = filters.priceMax * CENTS_PER_DOLLAR;
  }
  // Indoor/outdoor and free/paid are "either" toggles: selecting both is the
  // same as selecting neither (no constraint), so only constrain when exactly
  // one side is on. Otherwise "Indoor + Outdoor" would demand both flags and
  // "Free + Paid" would be an impossible price (= 0 and > 0).
  if (filters.indoor === true && filters.outdoor !== true) criteria.indoor = true;
  if (filters.outdoor === true && filters.indoor !== true) criteria.outdoor = true;
  if (filters.free === true && filters.paid !== true) criteria.free = true;
  if (filters.paid === true && filters.free !== true) criteria.paid = true;
  if (filters.date !== undefined) {
    criteria.eventDateWindow = resolveEventDateWindow(filters.date, now);
  }

  return criteria;
}

function findStartIndexAfter(ranked: RankedActivity[], cursor: FeedCursorKey): number {
  for (let i = 0; i < ranked.length; i++) {
    if (matchesCursor(ranked[i], cursor)) return i + 1;
  }
  return ranked.length;
}

function matchesCursor(item: RankedActivity, cursor: FeedCursorKey): boolean {
  return (
    item.id === cursor.id &&
    item.isFeatured === cursor.featured &&
    item.matchScore === cursor.matchScore &&
    isoOrNull(item.dateStart) === cursor.dateStart &&
    item.createdAt.toISOString() === cursor.createdAt
  );
}

function toCursorKey(item: RankedActivity): FeedCursorKey {
  return {
    featured: item.isFeatured,
    matchScore: item.matchScore,
    dateStart: isoOrNull(item.dateStart),
    createdAt: item.createdAt.toISOString(),
    id: item.id,
  };
}

function isoOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

export type { Activity };
