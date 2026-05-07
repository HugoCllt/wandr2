export class DuplicateCalendarEntryError extends Error {
  readonly userId: string;
  readonly activityId: string;
  readonly scheduledAt: Date;

  constructor(userId: string, activityId: string, scheduledAt: Date) {
    super(
      `Calendar entry already exists for user ${userId}, activity ${activityId}, at ${scheduledAt.toISOString()}.`,
    );
    this.name = 'DuplicateCalendarEntryError';
    this.userId = userId;
    this.activityId = activityId;
    this.scheduledAt = scheduledAt;
  }
}
