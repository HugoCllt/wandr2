import { describe, expect, it } from 'vitest';

import type { City, CityCreateInput } from '../../modules/activities/domain/City';
import type { ICityRepository } from '../../modules/activities/domain/ICityRepository';
import type { ICityWriteRepository } from '../../modules/activities/domain/ICityWriteRepository';
import { ensureCity, type EnsureCityInput } from './ensureCity';

class FakeCities implements ICityRepository, ICityWriteRepository {
  readonly created: CityCreateInput[] = [];
  constructor(private readonly cities: City[] = []) {}

  async findById(id: string): Promise<City | null> {
    return this.cities.find((c) => c.id === id) ?? null;
  }
  async findBySlug(slug: string): Promise<City | null> {
    return this.cities.find((c) => c.slug === slug) ?? null;
  }
  async list(): Promise<City[]> {
    return [...this.cities];
  }
  async create(input: CityCreateInput): Promise<City> {
    this.created.push(input);
    const city: City = { ...input, id: `city_${input.slug}` };
    this.cities.push(city);
    return city;
  }
}

function input(overrides: Partial<EnsureCityInput> = {}): EnsureCityInput {
  return {
    slug: 'new-york',
    name: 'New York',
    country: 'US',
    timezone: 'America/New_York',
    centerLat: 40.7128,
    centerLng: -74.006,
    bboxMinLat: 40.49,
    bboxMinLng: -74.26,
    bboxMaxLat: 40.92,
    bboxMaxLng: -73.7,
    ...overrides,
  };
}

const montreal: City = {
  id: 'city_mtl',
  slug: 'montreal',
  name: 'Montréal',
  country: 'CA',
  timezone: 'America/Toronto',
  centerLat: 45.5019,
  centerLng: -73.5674,
  bboxMinLat: 45.4,
  bboxMinLng: -73.98,
  bboxMaxLat: 45.71,
  bboxMaxLng: -73.47,
};

describe('ensureCity handler', () => {
  it('creates a city that does not exist yet', async () => {
    const cities = new FakeCities();

    const result = await ensureCity({ cities, cityWrites: cities }, input());

    expect(result).toEqual({ outcome: 'CREATED', slug: 'new-york', name: 'New York' });
    expect(cities.created).toHaveLength(1);
  });

  it('is idempotent: an existing slug returns EXISTS and writes nothing', async () => {
    const cities = new FakeCities([montreal]);

    const result = await ensureCity(
      { cities, cityWrites: cities },
      input({ slug: 'montreal', name: 'Montreal Overwritten' }),
    );

    expect(result).toEqual({ outcome: 'EXISTS', slug: 'montreal', name: 'Montréal' });
    expect(cities.created).toEqual([]);
  });

  it('rejects a center outside its own bbox and writes nothing', async () => {
    const cities = new FakeCities();

    await expect(
      ensureCity({ cities, cityWrites: cities }, input({ centerLat: 12 })),
    ).rejects.toThrow(/center/);
    expect(cities.created).toEqual([]);
  });

  it('rejects a bbox whose minimum is above its maximum', async () => {
    const cities = new FakeCities();

    await expect(
      ensureCity({ cities, cityWrites: cities }, input({ bboxMinLat: 41.5 })),
    ).rejects.toThrow(/minimum/);
    expect(cities.created).toEqual([]);
  });

  it('rejects a slug that is not kebab-case', async () => {
    const cities = new FakeCities();

    await expect(
      ensureCity({ cities, cityWrites: cities }, input({ slug: 'New York' })),
    ).rejects.toThrow(/slug/);
    expect(cities.created).toEqual([]);
  });
});
