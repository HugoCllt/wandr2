import { cookies, headers } from 'next/headers';
import { cache } from 'react';

import { getOptionalUser } from '../../../shared/auth/current-user';
import type { CityDTO } from '../../../shared/contracts/CityDTO';
import { prisma } from '../../../shared/db/prisma';
import type { City } from '../domain/City';
import { PrismaCityRepository } from '../infra/PrismaCityRepository';
import {
  FALLBACK_CITY_SLUG,
  resolveCityCandidates,
  resolveEagerCityCandidates,
} from './resolveCityCandidates';

/**
 * Session cookie (no Max-Age): a city picked in the Nav survives every
 * navigation and reload, and is gone when the browser session ends — the next
 * visit falls back to the profile city. See `tbd.md`.
 */
export const ACTIVE_CITY_COOKIE = 'wandr_city';

/** `cache` keeps this to one DB round trip per request — layouts, pages and
 * feed loaders all resolve the same city. */
export const getActiveCity = cache(async (): Promise<City> => {
  const cities = new PrismaCityRepository(prisma);

  const headerSlug = headers().get('x-wandr-city');
  const cookieSlug = cookies().get(ACTIVE_CITY_COOKIE)?.value ?? null;

  const eager = resolveEagerCityCandidates({ headerSlug, cookieSlug });
  for (const slug of eager) {
    const picked = await cities.findBySlug(slug);
    if (picked) return picked;
  }

  const user = await getOptionalUser();
  const candidates = resolveCityCandidates({
    headerSlug,
    cookieSlug,
    profileSlug: user?.citySlug ?? null,
  });

  for (const slug of candidates) {
    if (eager.includes(slug)) continue;
    const picked = await cities.findBySlug(slug);
    if (picked) return picked;
  }

  throw new Error(`No city available: seed "${FALLBACK_CITY_SLUG}" is missing.`);
});

export async function listCities(): Promise<CityDTO[]> {
  const cities = await new PrismaCityRepository(prisma).list();
  return cities.map(toCityDTO);
}

export function toCityDTO(city: City): CityDTO {
  return {
    slug: city.slug,
    name: city.name,
    country: city.country,
    timezone: city.timezone,
    centerLat: city.centerLat,
    centerLng: city.centerLng,
  };
}
