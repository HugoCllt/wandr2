import { NextResponse } from 'next/server';
import { z } from 'zod';

import { parseBody } from '../../../shared/api/parse';
import { prisma } from '../../../shared/db/prisma';
import { CityNotFoundError } from '../domain/CityNotFoundError';
import { PrismaCityRepository } from '../infra/PrismaCityRepository';
import { ACTIVE_CITY_COOKIE, toCityDTO } from './activeCity';

const SelectCityBodySchema = z.object({ slug: z.string().min(1) });

export async function selectCityRouteHandler(request: Request): Promise<NextResponse> {
  const { slug } = await parseBody(SelectCityBodySchema, request);

  const city = await new PrismaCityRepository(prisma).findBySlug(slug);
  if (!city) throw new CityNotFoundError(slug);

  const response = NextResponse.json(toCityDTO(city));
  response.cookies.set({
    name: ACTIVE_CITY_COOKIE,
    value: city.slug,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
