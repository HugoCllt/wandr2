import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '../../../shared/auth/current-user';
import { prisma } from '../../../shared/db/prisma';
import { ToggleFavoriteUseCase } from '../application/ToggleFavoriteUseCase';
import { PrismaFavoriteRepository } from '../infra/PrismaFavoriteRepository';

const ToggleBodySchema = z.object({
  activityId: z.string().min(1),
});

export async function toggleFavoriteRouteHandler(request: Request): Promise<NextResponse> {
  const json = await request.json().catch(() => null);
  const parsed = ToggleBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const user = await getCurrentUser();
  const useCase = new ToggleFavoriteUseCase(new PrismaFavoriteRepository(prisma));
  const result = await useCase.execute(user.id, parsed.data.activityId);
  return NextResponse.json(result);
}
