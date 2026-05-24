import { PrismaActivityRepository } from '../../activities/infra/PrismaActivityRepository';
import { getCurrentUser } from '../../../shared/auth/current-user';
import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { toActivityDTO } from '../../../shared/contracts/toActivityDTO';
import { dayKeyInTZ } from '../../../shared/ui/format/formatInTZ';
import { prisma } from '../../../shared/db/prisma';
import { ListCalendarEntriesUseCase } from '../application/ListCalendarEntriesUseCase';
import { parseMonthParam } from '../application/monthRange';
import { PrismaCalendarRepository } from '../infra/PrismaCalendarRepository';

export type CalendarMonthEntry = {
  id: string;
  scheduledAt: string;
  notes: string | null;
  dayKey: string;
  activity: ActivityDTO;
};

export type CalendarMonthData = {
  year: number;
  monthIndex: number;
  prev: { year: number; monthIndex: number };
  next: { year: number; monthIndex: number };
  entries: CalendarMonthEntry[];
  occupiedDayKeys: Set<string>;
};

export async function loadCalendarMonth(
  monthParam: string | null | undefined,
  now: Date = new Date(),
): Promise<CalendarMonthData> {
  const range = parseMonthParam(monthParam ?? null, now);
  const user = await getCurrentUser();

  const calendarUseCase = new ListCalendarEntriesUseCase(new PrismaCalendarRepository(prisma));
  const entries = await calendarUseCase.execute({
    userId: user.id,
    from: range.fromUtc,
    to: range.toUtc,
  });

  const activityIds = Array.from(new Set(entries.map((e) => e.activityId)));
  const activitiesRepo = new PrismaActivityRepository(prisma);
  const activities = await activitiesRepo.findByIds(activityIds);
  const activityById = new Map(activities.map((a) => [a.id, a]));

  const enriched: CalendarMonthEntry[] = entries.flatMap((entry) => {
    const activity = activityById.get(entry.activityId);
    if (!activity) return [];
    return [
      {
        id: entry.id,
        scheduledAt: entry.scheduledAt.toISOString(),
        notes: entry.notes,
        dayKey: dayKeyInTZ(entry.scheduledAt),
        activity: toActivityDTO(activity),
      },
    ];
  });

  const occupiedDayKeys = new Set(enriched.map((e) => e.dayKey));

  return {
    year: range.year,
    monthIndex: range.monthIndex,
    prev: range.prev,
    next: range.next,
    entries: enriched,
    occupiedDayKeys,
  };
}
