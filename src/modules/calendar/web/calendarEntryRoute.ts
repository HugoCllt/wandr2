import { NextResponse } from 'next/server';

import { getCurrentUser } from '../../../shared/auth/current-user';
import { prisma } from '../../../shared/db/prisma';
import { RemoveFromCalendarUseCase } from '../application/RemoveFromCalendarUseCase';
import { PrismaCalendarRepository } from '../infra/PrismaCalendarRepository';

export async function deleteCalendarEntryRouteHandler(
  _request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  const id = context.params.id?.trim();
  if (!id) {
    return NextResponse.json({ error: 'Missing entry id' }, { status: 400 });
  }

  const user = await getCurrentUser();
  const useCase = new RemoveFromCalendarUseCase(new PrismaCalendarRepository(prisma));
  await useCase.execute(user.id, id);
  return new NextResponse(null, { status: 204 });
}
