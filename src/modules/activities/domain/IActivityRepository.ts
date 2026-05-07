import type { Activity, ActivityCreateInput } from './Activity';
import type { ActivityCandidateCriteria } from './ActivityCandidateCriteria';

export interface IActivityRepository {
  create(input: ActivityCreateInput): Promise<Activity>;
  findBySlug(slug: string): Promise<Activity | null>;
  findCandidates(criteria: ActivityCandidateCriteria): Promise<Activity[]>;
  getOrCreateSourceIdByName(name: string): Promise<string>;
  slugExists(slug: string): Promise<boolean>;
}
