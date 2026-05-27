import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prisma } from '../../../shared/db/prisma';
import { PrismaActivityRepository } from './PrismaActivityRepository';

const NOW = new Date('2026-05-23T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const CITY_SLUG = 'mcp-it-recheck';
const SOURCE_NAME = 'mcp-it-recheck-source';

let cityId: string;
let sourceId: string;

async function seedPlace(id: string, recheckAfter: Date | null): Promise<void> {
  await prisma.activity.create({
    data: {
      id,
      slug: id,
      title: id,
      description: 'd',
      imageUrl: 'https://example.com/x.jpg',
      kind: 'PLACE',
      categories: { primary: 'FOOD', secondary: [] },
      address: 'a',
      latitude: 45.5,
      longitude: -73.6,
      priceMinCents: 0,
      sourceId,
      cityId,
      dedupeKey: id,
      recheckAfter,
    },
  });
}

beforeAll(async () => {
  const city = await prisma.city.upsert({
    where: { slug: CITY_SLUG },
    update: {},
    create: {
      slug: CITY_SLUG,
      name: 'MCP IT Recheck City',
      country: 'CA',
      timezone: 'America/Toronto',
      centerLat: 45.5019,
      centerLng: -73.5674,
      bboxMinLat: 45.4,
      bboxMinLng: -73.98,
      bboxMaxLat: 45.71,
      bboxMaxLng: -73.47,
    },
  });
  cityId = city.id;
  const source = await prisma.source.upsert({
    where: { name: SOURCE_NAME },
    update: {},
    create: { name: SOURCE_NAME },
  });
  sourceId = source.id;

  // Defensive: a previous crashed run may have left rows; explicit ids would then
  // collide on create. Start from a clean slate for this isolated city.
  await prisma.activity.deleteMany({ where: { cityId } });

  // Two of the three due rows share recheckAfter so the `id asc` tiebreaker is
  // what orders act_b before act_c (stable pagination, design §3.6).
  await seedPlace('act_a', new Date(NOW.getTime() - 3 * DAY));
  await seedPlace('act_b', new Date(NOW.getTime() - 2 * DAY));
  await seedPlace('act_c', new Date(NOW.getTime() - 2 * DAY));
  await seedPlace('act_future', new Date(NOW.getTime() + 10 * DAY)); // not yet due
  await seedPlace('act_null', null); // PLACEs with no deadline are never due
});

afterAll(async () => {
  await prisma.activity.deleteMany({ where: { cityId } });
  await prisma.source.deleteMany({ where: { id: sourceId } });
  await prisma.city.deleteMany({ where: { id: cityId } });
  await prisma.$disconnect();
});

describe('PrismaActivityRepository.findDueForRecheck (integration)', () => {
  it('returns due rows ordered by recheckAfter asc then id asc, excluding null/future', async () => {
    const repo = new PrismaActivityRepository(prisma);

    const due = await repo.findDueForRecheck(cityId, NOW);

    expect(due.map((a) => a.id)).toEqual(['act_a', 'act_b', 'act_c']);
  });

  it('bounds the result set with limit', async () => {
    const repo = new PrismaActivityRepository(prisma);

    const due = await repo.findDueForRecheck(cityId, NOW, 2);

    expect(due.map((a) => a.id)).toEqual(['act_a', 'act_b']);
  });
});
