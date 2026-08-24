import { prisma } from '../../../shared/db/prisma';
import { PrismaCalendarRepository } from '../infra/PrismaCalendarRepository';

export async function loadIsBookmarked(userId: string, activityId: string): Promise<boolean> {
  return new PrismaCalendarRepository(prisma).isBookmarked(userId, activityId);
}
