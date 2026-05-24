import type { Activity } from './Activity';

export type FreshnessUpdate = {
  lastSeenAt: Date;
  lastVerifiedAt: Date;
  recheckAfter: Date | null;
};

export interface IActivityIngestionRepository {
  findByCityAndDedupeKey(cityId: string, dedupeKey: string): Promise<Activity | null>;
  refreshFreshness(id: string, update: FreshnessUpdate): Promise<void>;
  findDueForRecheck(cityId: string, now: Date): Promise<Activity[]>;
  archive(id: string): Promise<void>;
}
