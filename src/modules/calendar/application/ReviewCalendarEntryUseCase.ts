import type { IActivityRepository } from '../../activities/domain/IActivityRepository';
import type { IAffinityRepository } from '../../affinity/domain/IAffinityRepository';
import type { CalendarEntry, CalendarReviewInput } from '../domain/CalendarEntry';
import { validateCalendarReview } from '../domain/CalendarEntry';
import { CalendarEntryNotFoundError } from '../domain/CalendarEntryNotFoundError';
import type { ICalendarRepository } from '../domain/ICalendarRepository';

export type ReviewCalendarEntryInput = CalendarReviewInput & {
  userId: string;
  entryId: string;
};

/**
 * Records a verdict on a past bookmarked activity and feeds it back into the
 * user's category affinity: DONE nudges the activity's primary category up
 * (more when satisfaction is high), MISSED nudges it down. Affinity stays on the
 * 0–10 scale (clamped by the repository).
 */
export class ReviewCalendarEntryUseCase {
  constructor(
    private readonly calendar: ICalendarRepository,
    private readonly activities: IActivityRepository,
    private readonly affinities: IAffinityRepository,
  ) {}

  async execute(input: ReviewCalendarEntryInput): Promise<CalendarEntry> {
    const review = validateCalendarReview({
      outcome: input.outcome,
      satisfaction: input.satisfaction,
      reviewNote: input.reviewNote,
    });

    const entry = await this.calendar.review(input.userId, input.entryId, review);
    if (!entry) {
      throw new CalendarEntryNotFoundError(input.entryId);
    }

    const activity = await this.activities.findById(entry.activityId);
    if (activity) {
      const delta = affinityDelta(review.outcome, review.satisfaction ?? null);
      if (delta !== 0) {
        await this.affinities.adjustScore(input.userId, activity.categories.primary, delta);
      }
    }

    return entry;
  }
}

function affinityDelta(outcome: 'DONE' | 'MISSED', satisfaction: number | null): number {
  if (outcome === 'MISSED') return -1;
  // DONE always lifts the category; a strong rating lifts it more.
  return satisfaction !== null && satisfaction >= 4 ? 2 : 1;
}
