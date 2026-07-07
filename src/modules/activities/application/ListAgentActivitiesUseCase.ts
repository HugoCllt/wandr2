import type { ActivityCandidateCriteria } from '../domain/ActivityCandidateCriteria';
import type { Activity, ActivityCategory, ActivityKind } from '../domain/Activity';
import type { IActivityRepository } from '../domain/IActivityRepository';

export type ListAgentActivitiesInput = {
  cityId: string;
  now: Date;
  categories?: ActivityCategory[];
  kind?: ActivityKind;
  priceMaxCents?: number;
  /** EVENT date window; PLACEs (undated) always pass. */
  eventDateWindow?: { from: Date; to: Date };
  limit?: number;
};

const DEFAULT_LIMIT = 50;

/**
 * Read path of the agent API (SuperMes/Hermes agents): published, non-expired
 * activities of a city, optionally filtered. No ranking/personalization — the
 * consumer is a machine that does its own selection; feed ranking stays a
 * product concern (GetFeedUseCase).
 */
export class ListAgentActivitiesUseCase {
  constructor(private readonly activities: IActivityRepository) {}

  async execute(input: ListAgentActivitiesInput): Promise<Activity[]> {
    const criteria: ActivityCandidateCriteria = {
      status: 'PUBLISHED',
      cityId: input.cityId,
      notExpiredAsOf: input.now,
    };
    if (input.categories && input.categories.length > 0) criteria.categories = input.categories;
    if (input.kind) criteria.kinds = [input.kind];
    if (input.priceMaxCents !== undefined) criteria.priceMaxCents = input.priceMaxCents;
    if (input.eventDateWindow) criteria.eventDateWindow = input.eventDateWindow;

    const found = await this.activities.findCandidates(criteria);
    return found.slice(0, input.limit ?? DEFAULT_LIMIT);
  }
}
