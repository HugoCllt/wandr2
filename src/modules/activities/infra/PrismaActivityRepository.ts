import type { Activity as PrismaActivityModel, Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import type { Activity, ActivityCreateInput } from '../domain/Activity';
import type { ActivityCategory, ActivityCategorySet } from '../domain/ActivityCategorySet';
import type { ActivityCandidateCriteria } from '../domain/ActivityCandidateCriteria';
import type {
  FreshnessUpdate,
  IActivityIngestionRepository,
} from '../domain/IActivityIngestionRepository';
import type {
  ActivityListFilter,
  IActivityRepository,
  NeighborhoodFacet,
} from '../domain/IActivityRepository';

export class PrismaActivityRepository
  implements IActivityRepository, IActivityIngestionRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: ActivityCreateInput): Promise<Activity> {
    const activity = await this.prisma.activity.create({
      data: { ...input, categories: input.categories as unknown as Prisma.InputJsonValue },
    });
    return toActivity(activity);
  }

  async findBySlug(slug: string): Promise<Activity | null> {
    const activity = await this.prisma.activity.findUnique({ where: { slug } });
    return activity ? toActivity(activity) : null;
  }

  async findById(id: string): Promise<Activity | null> {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    return activity ? toActivity(activity) : null;
  }

  async findByIds(ids: ReadonlyArray<string>): Promise<Activity[]> {
    if (ids.length === 0) return [];
    const activities = await this.prisma.activity.findMany({
      where: { id: { in: [...ids] } },
    });
    return activities.map(toActivity);
  }

  async findCandidates(criteria: ActivityCandidateCriteria): Promise<Activity[]> {
    const where: Prisma.ActivityWhereInput = { status: criteria.status, cityId: criteria.cityId };
    const and: Prisma.ActivityWhereInput[] = [];

    if (criteria.kinds && criteria.kinds.length > 0) {
      where.kind = { in: criteria.kinds };
    }
    if (criteria.categories && criteria.categories.length > 0) {
      const cats = criteria.categories;
      and.push({
        OR: [
          ...cats.map((c) => ({ categories: { path: ['primary'], equals: c } })),
          ...cats.map((c) => ({ categories: { path: ['secondary'], array_contains: c } })),
        ],
      });
    }
    if (criteria.neighborhoods && criteria.neighborhoods.length > 0) {
      where.neighborhood = { in: criteria.neighborhoods };
    }
    if (criteria.priceMaxCents !== undefined) {
      // "Fits the budget": the activity's top price must be within budget. When
      // there is no known ceiling (priceMaxCents null) we fall back to its
      // entry price (priceMinCents).
      and.push({
        OR: [
          { priceMaxCents: { lte: criteria.priceMaxCents } },
          { priceMaxCents: null, priceMinCents: { lte: criteria.priceMaxCents } },
        ],
      });
    }
    if (criteria.indoor === true) {
      where.indoor = true;
    }
    if (criteria.outdoor === true) {
      where.outdoor = true;
    }
    if (criteria.free === true) {
      and.push({ priceMinCents: 0 });
    }
    if (criteria.paid === true) {
      and.push({ priceMinCents: { gt: 0 } });
    }
    if (criteria.activityIds) {
      if (criteria.activityIds.length === 0) return [];
      where.id = { in: criteria.activityIds };
    }
    if (criteria.eventDateWindow) {
      and.push({
        OR: [
          { kind: 'PLACE' },
          {
            AND: [
              { kind: 'EVENT' },
              {
                dateStart: {
                  gte: criteria.eventDateWindow.from,
                  lte: criteria.eventDateWindow.to,
                },
              },
            ],
          },
        ],
      });
    }

    if (criteria.notExpiredAsOf) {
      and.push({
        OR: [{ expiresAt: null }, { expiresAt: { gt: criteria.notExpiredAsOf } }],
      });
    }

    if (and.length > 0) where.AND = and;

    const activities = await this.prisma.activity.findMany({ where });
    return activities.map(toActivity);
  }

  async getOrCreateSourceIdByName(name: string): Promise<string> {
    const source = await this.prisma.source.upsert({
      where: { name },
      update: {},
      create: { name },
      select: { id: true },
    });

    return source.id;
  }

  async slugExists(slug: string): Promise<boolean> {
    const activity = await this.prisma.activity.findUnique({
      where: { slug },
      select: { id: true },
    });

    return activity !== null;
  }

  async listNeighborhoodFacets(): Promise<NeighborhoodFacet[]> {
    const rows = await this.prisma.activity.findMany({
      where: { status: 'PUBLISHED', neighborhood: { not: null } },
      select: { neighborhood: true, categories: true },
    });

    const byName = new Map<string, Set<ActivityCategory>>();
    for (const row of rows) {
      if (!row.neighborhood) continue;
      const set = byName.get(row.neighborhood) ?? new Set<ActivityCategory>();
      const cats = row.categories as unknown as ActivityCategorySet;
      set.add(cats.primary);
      for (const c of cats.secondary) set.add(c);
      byName.set(row.neighborhood, set);
    }

    return [...byName.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, set]) => ({ name, categories: [...set] }));
  }

  async listFeatured(limit: number): Promise<Activity[]> {
    const activities = await this.prisma.activity.findMany({
      where: { isFeatured: true, status: 'PUBLISHED' },
      orderBy: [
        { dateStart: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'desc' },
        { id: 'asc' },
      ],
      take: limit,
    });
    return activities.map(toActivity);
  }

  async findByCityAndDedupeKey(cityId: string, dedupeKey: string): Promise<Activity | null> {
    const activity = await this.prisma.activity.findUnique({
      where: { cityId_dedupeKey: { cityId, dedupeKey } },
    });
    return activity ? toActivity(activity) : null;
  }

  async refreshFreshness(id: string, update: FreshnessUpdate): Promise<void> {
    await this.prisma.activity.update({
      where: { id },
      data: {
        lastSeenAt: update.lastSeenAt,
        lastVerifiedAt: update.lastVerifiedAt,
        recheckAfter: update.recheckAfter,
      },
    });
  }

  async findDueForRecheck(cityId: string, now: Date, limit?: number): Promise<Activity[]> {
    const activities = await this.prisma.activity.findMany({
      where: { cityId, status: 'PUBLISHED', recheckAfter: { lte: now } },
      orderBy: [{ recheckAfter: 'asc' }, { id: 'asc' }],
      take: limit,
    });
    return activities.map(toActivity);
  }

  async archive(id: string): Promise<void> {
    await this.prisma.activity.update({ where: { id }, data: { status: 'ARCHIVED' } });
  }

  async updateImageUrl(id: string, imageUrl: string): Promise<void> {
    await this.prisma.activity.update({ where: { id }, data: { imageUrl } });
  }

  async listForUpdate(cityId: string, filter: ActivityListFilter): Promise<Activity[]> {
    const where: Prisma.ActivityWhereInput = { cityId, status: 'PUBLISHED' };
    if (filter.kind) where.kind = filter.kind;
    if (filter.withoutImage) where.imageUrl = null;
    const activities = await this.prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: filter.limit,
    });
    return activities.map(toActivity);
  }
}

function toActivity(activity: PrismaActivityModel): Activity {
  return {
    id: activity.id,
    slug: activity.slug,
    title: activity.title,
    description: activity.description,
    imageUrl: activity.imageUrl,
    kind: activity.kind,
    categories: activity.categories as unknown as ActivityCategorySet,
    address: activity.address,
    neighborhood: activity.neighborhood,
    latitude: activity.latitude,
    longitude: activity.longitude,
    dateStart: activity.dateStart,
    dateEnd: activity.dateEnd,
    priceMinCents: activity.priceMinCents,
    priceMaxCents: activity.priceMaxCents,
    externalUrl: activity.externalUrl,
    indoor: activity.indoor,
    outdoor: activity.outdoor,
    isFeatured: activity.isFeatured,
    status: activity.status,
    sourceId: activity.sourceId,
    cityId: activity.cityId,
    dedupeKey: activity.dedupeKey,
    expiresAt: activity.expiresAt,
    lastSeenAt: activity.lastSeenAt,
    lastVerifiedAt: activity.lastVerifiedAt,
    recheckAfter: activity.recheckAfter,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
  };
}
