import type { Activity } from '../domain/Activity';
import type { IActivityRepository } from '../domain/IActivityRepository';

/** Events are "urgent" when they start, or close, within this many days. */
export const URGENT_WINDOW_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export class ListUrgentActivitiesUseCase {
  constructor(private readonly activities: IActivityRepository) {}

  async execute(cityId: string, now: Date, limit: number): Promise<Activity[]> {
    if (cityId.trim().length === 0) {
      throw new Error('ListUrgentActivitiesUseCase: cityId is required.');
    }
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error('ListUrgentActivitiesUseCase: limit must be a positive integer.');
    }
    const until = new Date(now.getTime() + URGENT_WINDOW_DAYS * DAY_MS);
    return this.activities.listUrgent(cityId, now, until, limit);
  }
}
