import type { Activity, ActivityCreateInput } from './Activity';
import type { ActivityCandidateCriteria } from './ActivityCandidateCriteria';

export interface IActivityRepository {
  create(input: ActivityCreateInput): Promise<Activity>;
  findBySlug(slug: string): Promise<Activity | null>;
  findById(id: string): Promise<Activity | null>;
  findByIds(ids: ReadonlyArray<string>): Promise<Activity[]>;
  findCandidates(criteria: ActivityCandidateCriteria): Promise<Activity[]>;
  getOrCreateSourceIdByName(name: string): Promise<string>;
  slugExists(slug: string): Promise<boolean>;
  listNeighborhoods(): Promise<string[]>;
  listFeatured(limit: number): Promise<Activity[]>;
  listUrgent(cityId: string, now: Date, until: Date, limit: number): Promise<Activity[]>;
}
