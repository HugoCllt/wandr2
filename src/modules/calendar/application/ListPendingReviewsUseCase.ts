import type { CalendarEntry } from '../domain/CalendarEntry';
import type { ICalendarRepository } from '../domain/ICalendarRepository';

const DEFAULT_LIMIT = 8;

/** Past bookmarks the user hasn't yet told us how they went. */
export class ListPendingReviewsUseCase {
  constructor(private readonly calendar: ICalendarRepository) {}

  async execute(userId: string, now: Date, limit = DEFAULT_LIMIT): Promise<CalendarEntry[]> {
    return this.calendar.listPendingReviews(userId, now, limit);
  }
}
