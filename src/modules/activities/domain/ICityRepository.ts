import type { City } from './City';

export interface ICityRepository {
  findById(id: string): Promise<City | null>;
  findBySlug(slug: string): Promise<City | null>;
}
