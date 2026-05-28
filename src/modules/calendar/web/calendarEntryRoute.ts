import { NextResponse } from 'next/server';

import { getCurrentUser } from '../../../shared/auth/current-user';
import { prisma } from '../../../shared/db/prisma';
import { RemoveFromCalendarUseCase } from '../application/RemoveFromCalendarUseCase';
import { PrismaCalendarRepository } from '../infra/PrismaCalendarRepository';

export async function deleteCalendarEntryRouteHandler(
  _request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  // Next.js only routes here when the [id] segment is non-empty, so no explicit
  // missing-id check is needed. A blank slug would 404 at the routing layer.
  const user = await getCurrentUser();
  const useCase = new RemoveFromCalendarUseCase(new PrismaCalendarRepository(prisma));
  await useCase.execute(user.id, context.params.id);
  return new NextResponse(null, { status: 204 });
}
