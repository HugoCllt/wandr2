import { NextResponse } from 'next/server';
import { z } from 'zod';

import { parseBody } from '../../../shared/api/parse';
import { getCurrentUser } from '../../../shared/auth/current-user';
import { PROFILE_AFFINITY_CATEGORIES } from '../../../shared/contracts/ProfileFormDTO';
import { prisma } from '../../../shared/db/prisma';
import { UpdateProfileUseCase } from '../application/UpdateProfileUseCase';
import { PrismaProfileRepository } from '../infra/PrismaProfileRepository';
import { loadProfileView } from './loadProfileView';

const ProfileFormSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'birthDate must be yyyy-mm-dd'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  cityId: z.string().min(1),
  bio: z.string().max(280),
  affinities: z.record(
    z.enum(PROFILE_AFFINITY_CATEGORIES),
    z.number().int().min(0).max(10),
  ),
});

export async function getProfileRouteHandler(): Promise<NextResponse> {
  const view = await loadProfileView();
  return NextResponse.json(view);
}

export async function updateProfileRouteHandler(request: Request): Promise<NextResponse> {
  const form = await parseBody(ProfileFormSchema, request);
  const user = await getCurrentUser();

  const affinities = PROFILE_AFFINITY_CATEGORIES.map((category) => ({
    category,
    score: form.affinities[category] ?? 0,
  }));

  await new UpdateProfileUseCase(new PrismaProfileRepository(prisma)).execute(user.id, {
    gender: form.gender,
    birthDate: new Date(form.birthDate),
    cityId: form.cityId,
    bio: form.bio,
    affinities,
  });

  return NextResponse.json({ ok: true });
}
