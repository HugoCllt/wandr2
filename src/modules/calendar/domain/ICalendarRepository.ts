import type { CalendarEntry, CalendarEntryCreateInput } from './CalendarEntry';

export type CalendarRangeQuery = {
  userId: string;
  from: Date;
  to: Date;
};

export interface ICalendarRepository {
  add(input: CalendarEntryCreateInput): Promise<CalendarEntry>;
  removeById(userId: string, id: string): Promise<boolean>;
  listInRange(query: CalendarRangeQuery): Promise<CalendarEntry[]>;
}
