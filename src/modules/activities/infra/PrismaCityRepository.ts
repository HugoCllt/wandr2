import type { City as PrismaCityModel, PrismaClient } from '@prisma/client';

import type { City } from '../domain/City';
import type { ICityRepository } from '../domain/ICityRepository';

export class PrismaCityRepository implements ICityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<City | null> {
    const city = await this.prisma.city.findUnique({ where: { id } });
    return city ? toCity(city) : null;
  }

  async findBySlug(slug: string): Promise<City | null> {
    const city = await this.prisma.city.findUnique({ where: { slug } });
    return city ? toCity(city) : null;
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
