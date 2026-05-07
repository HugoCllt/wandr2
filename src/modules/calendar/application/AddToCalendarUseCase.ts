import { ActivityNotFoundError } from '../../activities/domain/ActivityNotFoundError';
import type { IActivityRepository } from '../../activities/domain/IActivityRepository';
import type { CalendarEntry } from '../domain/CalendarEntry';
import { createCalendarEntry } from '../domain/CalendarEntry';
import type { ICalendarRepository } from '../domain/ICalendarRepository';

export type AddToCalendarInput = {
  userId: string;
  activityId: string;
  scheduledAt: Date;
  notes?: string | null;
};

export class AddToCalendarUseCase {
  constructor(
    private readonly calendar: ICalendarRepository,
    private readonly activities: IActivityRepository,
  ) {}

  async execute(input: AddToCalendarInput): Promise<CalendarEntry> {
    const validated = createCalendarEntry(input);
    const activity = await this.activities.findById(input.activityId);
    if (!activity) {
      throw new ActivityNotFoundError(input.activityId);
    }
    return this.calendar.add(validated);
  }
}
