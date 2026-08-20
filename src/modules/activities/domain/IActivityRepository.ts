import type { Activity, ActivityCategory, ActivityCreateInput, ActivityKind } from './Activity';
import type { ActivityCandidateCriteria } from './ActivityCandidateCriteria';

export type ActivityListFilter = {
  kind?: ActivityKind;
  withoutImage?: boolean;
  limit?: number;
};

/** A neighborhood with the set of categories that have published activities there. */
export type NeighborhoodFacet = {
  name: string;
  categories: ActivityCategory[];
};

export interface IActivityRepository {
  create(input: ActivityCreateInput): Promise<Activity>;
  findBySlug(slug: string): Promise<Activity | null>;
  findById(id: string): Promise<Activity | null>;
  findByIds(ids: ReadonlyArray<string>): Promise<Activity[]>;
  findCandidates(criteria: ActivityCandidateCriteria): Promise<Activity[]>;
  getOrCreateSourceIdByName(name: string): Promise<string>;
  slugExists(slug: string): Promise<boolean>;
  listNeighborhoodFacets(cityId: string): Promise<NeighborhoodFacet[]>;
  listFeatured(limit: number, cityId: string): Promise<Activity[]>;
  listForUpdate(cityId: string, filter: ActivityListFilter): Promise<Activity[]>;
}
