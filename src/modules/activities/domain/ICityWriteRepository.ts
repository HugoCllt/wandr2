import type { City, CityCreateInput } from './City';

/**
 * Write side of the city store, segregated from `ICityRepository` the way
 * `IActivityIngestionRepository` is segregated from `IActivityRepository`:
 * only the ingestion entry point creates cities, the product only reads them.
 */
export interface ICityWriteRepository {
  create(input: CityCreateInput): Promise<City>;
}
