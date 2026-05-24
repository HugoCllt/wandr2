import { computeRecheckAfter } from '../domain/freshness';
import type { IActivityIngestionRepository } from '../domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../domain/IActivityRepository';

export type ConfirmActivityInput = {
  activityId: string;
  now: Date;
};

/**
 * Spec §6: the orchestrator agent has confirmed (via Tavily) that an activity
 * still exists. Refresh its freshness timestamps to `now` and recompute the
 * absolute `recheckAfter` deadline. The judgment lives in the agent; this use
 * case is the deterministic write the recheck MCP tool will call.
 */
export class ConfirmActivityUseCase {
  constructor(
    private readonly activities: IActivityRepository,
    private readonly ingestion: IActivityIngestionRepository,
  ) {}

  async execute(input: ConfirmActivityInput): Promise<{ recheckAfter: Date | null }> {
    const activity = await this.activities.findById(input.activityId);
    if (!activity) {
      throw new Error(`Activity ${input.activityId} not found.`);
    }

    const recheckAfter = computeRecheckAfter({ kind: activity.kind, lastSeenAt: input.now });

    await this.ingestion.refreshFreshness(activity.id, {
      lastSeenAt: input.now,
      lastVerifiedAt: input.now,
      recheckAfter,
    });

    return { recheckAfter };
  }
}
