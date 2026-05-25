// TEMPORARY test scaffold (spec §10) — antedates recheckAfter so /wandr-recheck has work.
// DELETE after AC#3/#4 are validated (CLAUDE.md §3). Not imported by anything.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const city = await prisma.city.findUnique({ where: { slug: 'montreal' } });
  if (!city) throw new Error('City "montreal" not found — run /wandr-ingest first.');

  const places = await prisma.activity.findMany({
    where: { cityId: city.id, kind: 'PLACE', status: 'PUBLISHED' },
    take: 12,
    select: { id: true, title: true },
  });

  const ids = places.map((p) => p.id);
  await prisma.activity.updateMany({
    where: { id: { in: ids } },
    data: { recheckAfter: new Date(0) },
  });

  console.log(`Antedated ${ids.length} PLACE(s) due for recheck:`);
  for (const p of places) console.log(` - ${p.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
