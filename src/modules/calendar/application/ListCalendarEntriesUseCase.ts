import type { CalendarEntry } from '../domain/CalendarEntry';
import type { ICalendarRepository } from '../domain/ICalendarRepository';

export type ListCalendarEntriesInput = {
  userId: string;
  from: Date;
  to: Date;
};

export class ListCalendarEntriesUseCase {
  constructor(private readonly calendar: ICalendarRepository) {}

  async execute(input: ListCalendarEntriesInput): Promise<CalendarEntry[]> {
    if (input.to.getTime() < input.from.getTime()) {
      throw new Error('ListCalendarEntries: `to` must be greater than or equal to `from`.');
    }
    return this.calendar.listInRange({
      userId: input.userId,
      from: input.from,
      to: input.to,
    });
  }
}
