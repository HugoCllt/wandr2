import type { CalendarEntry, CalendarOutcome } from '../../modules/calendar/domain/CalendarEntry';

export type CalendarEntryDTO = {
  id: string;
  userId: string;
  activityId: string;
  scheduledAt: string;
  notes: string | null;
  outcome: CalendarOutcome;
  satisfaction: number | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export function toCalendarEntryDTO(entry: CalendarEntry): CalendarEntryDTO {
  return {
    id: entry.id,
    userId: entry.userId,
    activityId: entry.activityId,
    scheduledAt: entry.scheduledAt.toISOString(),
    notes: entry.notes,
    outcome: entry.outcome,
    satisfaction: entry.satisfaction,
    reviewNote: entry.reviewNote,
    reviewedAt: entry.reviewedAt ? entry.reviewedAt.toISOString() : null,
    createdAt: entry.createdAt.toISOString(),
  };
}
