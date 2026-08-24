export type CalendarOutcome = 'PENDING' | 'DONE' | 'MISSED';

export type CalendarEntry = {
  id: string;
  userId: string;
  activityId: string;
  scheduledAt: Date;
  notes: string | null;
  outcome: CalendarOutcome;
  satisfaction: number | null;
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
};
