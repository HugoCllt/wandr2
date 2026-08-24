export type { CalendarOutcome, CalendarEntry } from '@wandr/shared';

export type CalendarEntryCreateInput = {
  userId: string;
  activityId: string;
  scheduledAt: Date;
  notes?: string | null;
};

export const CALENDAR_NOTES_MAX_LENGTH = 200;
export const CALENDAR_REVIEW_NOTE_MAX_LENGTH = 280;

export function createCalendarEntry(input: CalendarEntryCreateInput): CalendarEntryCreateInput {
  if (input.userId.trim().length === 0) {
    throw new Error('CalendarEntry userId is required.');
  }
  if (input.activityId.trim().length === 0) {
    throw new Error('CalendarEntry activityId is required.');
  }
  if (!(input.scheduledAt instanceof Date) || Number.isNaN(input.scheduledAt.getTime())) {
    throw new Error('CalendarEntry scheduledAt must be a valid Date.');
  }
  if (input.notes != null && input.notes.length > CALENDAR_NOTES_MAX_LENGTH) {
    throw new Error(
      `CalendarEntry notes must be ${CALENDAR_NOTES_MAX_LENGTH} characters or fewer.`,
    );
  }
  return input;
}

/** A user's verdict on a past bookmarked activity. */
export type CalendarReviewInput = {
  outcome: 'DONE' | 'MISSED';
  satisfaction?: number | null;
  reviewNote?: string | null;
};

/**
 * Validates a review of a past entry. Satisfaction (1–5) is required when the
 * activity was DONE and forbidden when MISSED (nothing to rate).
 */
export function validateCalendarReview(input: CalendarReviewInput): CalendarReviewInput {
  if (input.outcome !== 'DONE' && input.outcome !== 'MISSED') {
    throw new Error('CalendarEntry review outcome must be DONE or MISSED.');
  }
  if (input.outcome === 'DONE') {
    const s = input.satisfaction;
    if (!Number.isInteger(s) || s == null || s < 1 || s > 5) {
      throw new Error('CalendarEntry review satisfaction must be an integer between 1 and 5.');
    }
  } else if (input.satisfaction != null) {
    throw new Error('CalendarEntry review satisfaction is only allowed when DONE.');
  }
  if (input.reviewNote != null && input.reviewNote.length > CALENDAR_REVIEW_NOTE_MAX_LENGTH) {
    throw new Error(
      `CalendarEntry reviewNote must be ${CALENDAR_REVIEW_NOTE_MAX_LENGTH} characters or fewer.`,
    );
  }
  return input;
}
