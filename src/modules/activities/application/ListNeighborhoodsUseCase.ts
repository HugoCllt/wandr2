import type { IActivityRepository } from '../domain/IActivityRepository';

export class ListNeighborhoodsUseCase {
  constructor(private readonly activities: IActivityRepository) {}

  async execute(): Promise<string[]> {
    return this.activities.listNeighborhoods();
  }
}
