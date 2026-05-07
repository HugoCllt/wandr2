import type { CalendarEntry } from '../../modules/calendar/domain/CalendarEntry';

export type CalendarEntryDTO = {
  id: string;
  userId: string;
  activityId: string;
  scheduledAt: string;
  notes: string | null;
  createdAt: string;
};

export function toCalendarEntryDTO(entry: CalendarEntry): CalendarEntryDTO {
  return {
    id: entry.id,
    userId: entry.userId,
    activityId: entry.activityId,
    scheduledAt: entry.scheduledAt.toISOString(),
    notes: entry.notes,
    createdAt: entry.createdAt.toISOString(),
  };
}
