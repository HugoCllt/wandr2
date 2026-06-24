import type { IActivityRepository, NeighborhoodFacet } from '../domain/IActivityRepository';

export class ListNeighborhoodsUseCase {
  constructor(private readonly activities: IActivityRepository) {}

  async execute(): Promise<NeighborhoodFacet[]> {
    return this.activities.listNeighborhoodFacets();
  }
}
