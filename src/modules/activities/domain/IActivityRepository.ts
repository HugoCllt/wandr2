import type { Activity, ActivityCreateInput } from './Activity';

export interface IActivityRepository {
  create(input: ActivityCreateInput): Promise<Activity>;
  findBySlug(slug: string): Promise<Activity | null>;
  getOrCreateSourceIdByName(name: string): Promise<string>;
  slugExists(slug: string): Promise<boolean>;
}
