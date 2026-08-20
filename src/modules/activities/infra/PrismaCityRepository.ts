import type { City as PrismaCityModel, PrismaClient } from '@prisma/client';

import type { City, CityCreateInput } from '../domain/City';
import type { ICityRepository } from '../domain/ICityRepository';
import type { ICityWriteRepository } from '../domain/ICityWriteRepository';

export class PrismaCityRepository implements ICityRepository, ICityWriteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<City | null> {
    const city = await this.prisma.city.findUnique({ where: { id } });
    return city ? toCity(city) : null;
  }

  async findBySlug(slug: string): Promise<City | null> {
    const city = await this.prisma.city.findUnique({ where: { slug } });
    return city ? toCity(city) : null;
  }

  async list(): Promise<City[]> {
    const cities = await this.prisma.city.findMany({ orderBy: { name: 'asc' } });
    return cities.map(toCity);
  }

  async create(input: CityCreateInput): Promise<City> {
    const city = await this.prisma.city.create({ data: input });
    return toCity(city);
  }
}

function toCity(city: PrismaCityModel): City {
  return {
    id: city.id,
    slug: city.slug,
    name: city.name,
    country: city.country,
    timezone: city.timezone,
    centerLat: city.centerLat,
    centerLng: city.centerLng,
    bboxMinLat: city.bboxMinLat,
    bboxMinLng: city.bboxMinLng,
    bboxMaxLat: city.bboxMaxLat,
    bboxMaxLng: city.bboxMaxLng,
  };
}
