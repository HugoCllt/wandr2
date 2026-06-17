import { PrismaActivityRepository } from '../../activities/infra/PrismaActivityRepository';
import { getCurrentUser } from '../../../shared/auth/current-user';
import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { toActivityDTO } from '../../../shared/contracts/toActivityDTO';
import { prisma } from '../../../shared/db/prisma';
import { ListPendingReviewsUseCase } from '../application/ListPendingReviewsUseCase';
import { PrismaCalendarRepository } from '../infra/PrismaCalendarRepository';

export type PendingReview = {
  id: string;
  scheduledAt: string;
  activity: ActivityDTO;
};

/** Past bookmarks the user hasn't yet reviewed, joined to their activity. */
export async function loadPendingReviews(now: Date = new Date()): Promise<PendingReview[]> {
  const user = await getCurrentUser();
  const useCase = new ListPendingReviewsUseCase(new PrismaCalendarRepository(prisma));
  const entries = await useCase.execute(user.id, now);
  if (entries.length === 0) return [];

  const activityIds = Array.from(new Set(entries.map((e) => e.activityId)));
  const activities = await new PrismaActivityRepository(prisma).findByIds(activityIds);
  const activityById = new Map(activities.map((a) => [a.id, a]));

  return entries.flatMap((entry) => {
    const activity = activityById.get(entry.activityId);
    if (!activity) return [];
    return [
      {
        id: entry.id,
        scheduledAt: entry.scheduledAt.toISOString(),
        activity: toActivityDTO(activity),
      },
    ];
  });
}
