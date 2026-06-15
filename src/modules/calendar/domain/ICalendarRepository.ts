import type {
  CalendarEntry,
  CalendarEntryCreateInput,
  CalendarReviewInput,
} from './CalendarEntry';

export type CalendarRangeQuery = {
  userId: string;
  from: Date;
  to: Date;
};

export interface ICalendarRepository {
  add(input: CalendarEntryCreateInput): Promise<CalendarEntry>;
  removeById(userId: string, id: string): Promise<boolean>;
  /** Toggle-off from a card: drop the single bookmark for this activity. */
  removeByActivityId(userId: string, activityId: string): Promise<boolean>;
  listInRange(query: CalendarRangeQuery): Promise<CalendarEntry[]>;
  /** Activity ids the user has bookmarked (for `isBookmarked` flags). */
  listActivityIdsForUser(userId: string): Promise<string[]>;
  /** Past bookmarks still awaiting a verdict, soonest-elapsed first. */
  listPendingReviews(userId: string, before: Date, limit: number): Promise<CalendarEntry[]>;
  /** Persist a review verdict; returns the updated entry or null if not found. */
  review(userId: string, id: string, input: CalendarReviewInput): Promise<CalendarEntry | null>;
}
