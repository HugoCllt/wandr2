import type { Activity } from './Activity';

export type FreshnessUpdate = {
  lastSeenAt: Date;
  lastVerifiedAt: Date;
  recheckAfter: Date | null;
};

export interface IActivityIngestionRepository {
  findByCityAndDedupeKey(cityId: string, dedupeKey: string): Promise<Activity | null>;
  refreshFreshness(id: string, update: FreshnessUpdate): Promise<void>;
  /**
   * Due = PUBLISHED in `cityId` with `recheckAfter <= now`. Ordered
   * `recheckAfter asc, id asc` (the id tiebreaker keeps pagination stable when
   * deadlines tie). `recheckAfter <= now` already excludes `null` deadlines.
   * `limit` (when given) bounds the result to the N oldest-due rows.
   */
  findDueForRecheck(cityId: string, now: Date, limit?: number): Promise<Activity[]>;
  archive(id: string): Promise<void>;
  updateImageUrl(id: string, imageUrl: string): Promise<void>;
}
