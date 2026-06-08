import type { Activity, ActivityCreateInput, ActivityKind } from './Activity';
import type { ActivityCandidateCriteria } from './ActivityCandidateCriteria';

export type ActivityListFilter = {
  kind?: ActivityKind;
  withoutImage?: boolean;
  limit?: number;
};

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
  listForUpdate(cityId: string, filter: ActivityListFilter): Promise<Activity[]>;
}
