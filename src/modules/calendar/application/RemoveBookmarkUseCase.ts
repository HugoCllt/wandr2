import type { ICalendarRepository } from '../domain/ICalendarRepository';

/** Toggle-off a card's signet: removes the activity's single calendar bookmark. */
export class RemoveBookmarkUseCase {
  constructor(private readonly calendar: ICalendarRepository) {}

  async execute(userId: string, activityId: string): Promise<{ removed: boolean }> {
    const removed = await this.calendar.removeByActivityId(userId, activityId);
    return { removed };
  }
}
