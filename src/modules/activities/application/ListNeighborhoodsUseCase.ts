import type { IActivityRepository, NeighborhoodFacet } from '../domain/IActivityRepository';

export class ListNeighborhoodsUseCase {
  constructor(private readonly activities: IActivityRepository) {}

  async execute(cityId: string): Promise<NeighborhoodFacet[]> {
    return this.activities.listNeighborhoodFacets(cityId);
  }
}
