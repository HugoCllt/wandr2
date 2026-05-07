import type { Activity as PrismaActivityModel, Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import type { Activity, ActivityCreateInput } from '../domain/Activity';
import type { ActivityCandidateCriteria } from '../domain/ActivityCandidateCriteria';
import type { IActivityRepository } from '../domain/IActivityRepository';

export class PrismaActivityRepository implements IActivityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: ActivityCreateInput): Promise<Activity> {
    const activity = await this.prisma.activity.create({
      data: {
        slug: input.slug,
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl,
        imageCredit: input.imageCredit,
        kind: input.kind,
        category: input.category,
        address: input.address,
        neighborhood: input.neighborhood,
        latitude: input.latitude,
        longitude: input.longitude,
        dateStart: input.dateStart,
        dateEnd: input.dateEnd,
        priceMinCents: input.priceMinCents,
        priceMaxCents: input.priceMaxCents,
        externalUrl: input.externalUrl,
        indoor: input.indoor,
        outdoor: input.outdoor,
        isFeatured: input.isFeatured,
        status: input.status,
        sourceId: input.sourceId,
        externalId: input.externalId,
      },
    });

    return toActivity(activity);
  }

  async findBySlug(slug: string): Promise<Activity | null> {
    const activity = await this.prisma.activity.findUnique({ where: { slug } });
    return activity ? toActivity(activity) : null;
  }

  async findCandidates(criteria: ActivityCandidateCriteria): Promise<Activity[]> {
    const where: Prisma.ActivityWhereInput = { status: criteria.status };
    const and: Prisma.ActivityWhereInput[] = [];

    if (criteria.kinds && criteria.kinds.length > 0) {
      where.kind = { in: criteria.kinds };
    }
    if (criteria.categories && criteria.categories.length > 0) {
      where.category = { in: criteria.categories };
    }
    if (criteria.neighborhoods && criteria.neighborhoods.length > 0) {
      where.neighborhood = { in: criteria.neighborhoods };
    }
    if (criteria.priceMaxCents !== undefined) {
      and.push({ priceMinCents: { lte: criteria.priceMaxCents } });
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

  async listNeighborhoods(): Promise<string[]> {
    const rows = await this.prisma.activity.findMany({
      where: { status: 'PUBLISHED', neighborhood: { not: null } },
      select: { neighborhood: true },
      distinct: ['neighborhood'],
      orderBy: { neighborhood: 'asc' },
    });
    return rows
      .map((r) => r.neighborhood)
      .filter((n): n is string => n !== null);
  }
}

function toActivity(activity: PrismaActivityModel): Activity {
  return {
    id: activity.id,
    slug: activity.slug,
    title: activity.title,
    description: activity.description,
    imageUrl: activity.imageUrl,
    imageCredit: activity.imageCredit,
    kind: activity.kind,
    category: activity.category,
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
    externalId: activity.externalId,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
  };
}
