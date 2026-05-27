import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prisma } from '../../../shared/db/prisma';
import { PrismaActivityRepository } from './PrismaActivityRepository';

const CITY_SLUG = 'it-categoryset';
const SOURCE_NAME = 'it-categoryset-source';
const ACTIVITY_ID = 'act_food_romantic';

let cityId: string;
let sourceId: string;

beforeAll(async () => {
  const city = await prisma.city.upsert({
    where: { slug: CITY_SLUG },
    update: {},
    create: {
      slug: CITY_SLUG,
      name: 'Category Set IT City',
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

  await prisma.activity.deleteMany({ where: { cityId } });

  // One activity that IS FOOD and ALSO ROMANTIC — must surface in both feeds.
  await prisma.activity.create({
    data: {
      id: ACTIVITY_ID,
      slug: ACTIVITY_ID,
      title: 'Candle-lit bistro',
      description: 'd',
      imageUrl: 'https://example.com/x.jpg',
      kind: 'PLACE',
      categories: { primary: 'FOOD', secondary: ['ROMANTIC'] },
      address: 'a',
      latitude: 45.5,
      longitude: -73.6,
      priceMinCents: 0,
      sourceId,
      cityId,
      dedupeKey: ACTIVITY_ID,
    },
  });
});

afterAll(async () => {
  await prisma.activity.deleteMany({ where: { cityId } });
  await prisma.source.deleteMany({ where: { id: sourceId } });
  await prisma.city.deleteMany({ where: { id: cityId } });
  await prisma.$disconnect();
});

describe('PrismaActivityRepository.findCandidates by category set (integration)', () => {
  const repo = () => new PrismaActivityRepository(prisma);

  it('returns a {primary: FOOD, secondary: [ROMANTIC]} activity for the FOOD feed', async () => {
    const found = await repo().findCandidates({
      status: 'PUBLISHED',
      cityId,
      categories: ['FOOD'],
    });
    expect(found.map((a) => a.id)).toContain(ACTIVITY_ID);
  });

  it('returns the same activity for the ROMANTIC feed (secondary match)', async () => {
    const found = await repo().findCandidates({
      status: 'PUBLISHED',
      cityId,
      categories: ['ROMANTIC'],
    });
    expect(found.map((a) => a.id)).toContain(ACTIVITY_ID);
  });

  it('excludes the activity from a non-matching feed', async () => {
    const found = await repo().findCandidates({
      status: 'PUBLISHED',
      cityId,
      categories: ['SPORT'],
    });
    expect(found.map((a) => a.id)).not.toContain(ACTIVITY_ID);
  });
});
