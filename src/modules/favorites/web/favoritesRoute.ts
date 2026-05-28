import { NextResponse } from 'next/server';
import { z } from 'zod';

import { parseBody } from '../../../shared/api/parse';
import { getCurrentUser } from '../../../shared/auth/current-user';
import { prisma } from '../../../shared/db/prisma';
import { ToggleFavoriteUseCase } from '../application/ToggleFavoriteUseCase';
import { PrismaFavoriteRepository } from '../infra/PrismaFavoriteRepository';

const ToggleBodySchema = z.object({
  activityId: z.string().min(1),
});

export async function toggleFavoriteRouteHandler(request: Request): Promise<NextResponse> {
  const { activityId } = await parseBody(ToggleBodySchema, request);
  const user = await getCurrentUser();
  const useCase = new ToggleFavoriteUseCase(new PrismaFavoriteRepository(prisma));
  const result = await useCase.execute(user.id, activityId);
  return NextResponse.json(result);
}
