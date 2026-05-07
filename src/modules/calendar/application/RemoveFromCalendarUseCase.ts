import type { ICalendarRepository } from '../domain/ICalendarRepository';

export class RemoveFromCalendarUseCase {
  constructor(private readonly calendar: ICalendarRepository) {}

  async execute(userId: string, id: string): Promise<{ removed: boolean }> {
    const removed = await this.calendar.removeById(userId, id);
    return { removed };
  }
}
