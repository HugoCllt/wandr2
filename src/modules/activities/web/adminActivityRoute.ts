import { NextResponse } from 'next/server';
import { z } from 'zod';

import { env } from '../../../shared/config/env';
import { toActivityDTO } from '../../../shared/contracts/toActivityDTO';
import { prisma } from '../../../shared/db/prisma';
import { CreateActivityUseCase } from '../application/CreateActivityUseCase';
import { ActivityCategories, ActivityKinds, ActivityStatuses } from '../domain/Activity';
import { PrismaActivityRepository } from '../infra/PrismaActivityRepository';
import { PrismaCityRepository } from '../infra/PrismaCityRepository';

const AdminActivitySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().url(),
  imageCredit: z.string().min(1).nullable().optional(),
  kind: z.enum(ActivityKinds),
  category: z.enum(ActivityCategories),
  address: z.string().min(1),
  neighborhood: z.string().min(1).nullable().optional(),
  latitude: z.number(),
  longitude: z.number(),
  dateStart: z.string().datetime().nullable().optional(),
  dateEnd: z.string().datetime().nullable().optional(),
  priceMinCents: z.number().int().nonnegative(),
  priceMaxCents: z.number().int().nonnegative().nullable().optional(),
  externalUrl: z.string().url().nullable().optional(),
  indoor: z.boolean().optional(),
  outdoor: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  status: z.enum(ActivityStatuses).optional(),
  externalId: z.string().min(1).nullable().optional(),
  slug: z.string().min(1).optional(),
  citySlug: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

export async function postAdminActivity(request: Request): Promise<NextResponse> {
  if (request.headers.get('x-admin-token') !== env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = AdminActivitySchema.parse(await request.json());

  const citySlug = body.citySlug ?? 'montreal';
  const city = await new PrismaCityRepository(prisma).findBySlug(citySlug);
  if (!city) {
    return NextResponse.json({ error: `Unknown city: ${citySlug}` }, { status: 400 });
  }

  const useCase = new CreateActivityUseCase(new PrismaActivityRepository(prisma));

  const activity = await useCase.execute({
    title: body.title,
    description: body.description,
    imageUrl: body.imageUrl,
    imageCredit: body.imageCredit ?? null,
    kind: body.kind,
    category: body.category,
    address: body.address,
    neighborhood: body.neighborhood ?? null,
    latitude: body.latitude,
    longitude: body.longitude,
    dateStart: body.dateStart ? new Date(body.dateStart) : null,
    dateEnd: body.dateEnd ? new Date(body.dateEnd) : null,
    priceMinCents: body.priceMinCents,
    priceMaxCents: body.priceMaxCents ?? null,
    externalUrl: body.externalUrl ?? null,
    indoor: body.indoor ?? false,
    outdoor: body.outdoor ?? false,
    isFeatured: body.isFeatured ?? false,
    status: body.status ?? 'PUBLISHED',
    externalId: body.externalId ?? null,
    slug: body.slug,
    cityId: city.id,
    tags: body.tags ?? [],
  });

  return NextResponse.json(toActivityDTO(activity), { status: 201 });
}
