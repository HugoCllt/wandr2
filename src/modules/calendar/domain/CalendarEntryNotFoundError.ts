export class CalendarEntryNotFoundError extends Error {
  readonly id: string;

  constructor(id: string) {
    super(`Calendar entry ${id} not found.`);
    this.name = 'CalendarEntryNotFoundError';
    this.id = id;
  }
}
