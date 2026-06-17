export class DuplicateCalendarEntryError extends Error {
  readonly userId: string;
  readonly activityId: string;

  constructor(userId: string, activityId: string) {
    super(`Calendar entry already exists for user ${userId}, activity ${activityId}.`);
    this.name = 'DuplicateCalendarEntryError';
    this.userId = userId;
    this.activityId = activityId;
  }
}
