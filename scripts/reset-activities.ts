import { prisma } from '../src/shared/db/prisma';

// Wipes every activity and everything that references one, leaving the rest of
// the DB intact: City (+ bbox), User (+ affinities, accounts, sessions), Source.
// Run before a fresh ingestion to clear seed/test activities and prior runs.
// FK-safe order: delete children (Favorite, CalendarEntry) before Activity.
// RawActivityCandidate has no FK to Activity but is the per-run audit trail, so
// it's cleared too for a clean slate.
async function main() {
  const calendarEntries = await prisma.calendarEntry.deleteMany();
  const favorites = await prisma.favorite.deleteMany();
  const activities = await prisma.activity.deleteMany();
  const candidates = await prisma.rawActivityCandidate.deleteMany();

  console.log('Activities reset — kept City, User, affinities, Source.');
  console.table({
    calendarEntries: calendarEntries.count,
    favorites: favorites.count,
    activities: activities.count,
    candidates: candidates.count,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
