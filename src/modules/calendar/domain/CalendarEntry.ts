export type CalendarEntry = {
  id: string;
  userId: string;
  activityId: string;
  scheduledAt: Date;
  notes: string | null;
  createdAt: Date;
};

export type CalendarEntryCreateInput = {
  userId: string;
  activityId: string;
  scheduledAt: Date;
  notes?: string | null;
};

export const CALENDAR_NOTES_MAX_LENGTH = 200;

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
