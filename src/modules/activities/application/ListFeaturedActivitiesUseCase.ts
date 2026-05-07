import type { Activity } from '../domain/Activity';
import type { IActivityRepository } from '../domain/IActivityRepository';

export class ListFeaturedActivitiesUseCase {
  constructor(private readonly activities: IActivityRepository) {}

  async execute(limit: number): Promise<Activity[]> {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error('ListFeaturedActivitiesUseCase: limit must be a positive integer.');
    }
    return this.activities.listFeatured(limit);
  }
}
