import type { Activity } from '../domain/Activity';
import { ActivityNotFoundError } from '../domain/ActivityNotFoundError';
import type { IActivityRepository } from '../domain/IActivityRepository';

export class GetActivityUseCase {
  constructor(private readonly activities: IActivityRepository) {}

  async execute(slug: string): Promise<Activity> {
    const activity = await this.activities.findBySlug(slug);
    if (!activity) {
      throw new ActivityNotFoundError(slug);
    }
    return activity;
  }
}
