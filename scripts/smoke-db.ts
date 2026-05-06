import { prisma } from '../src/shared/db/prisma';

async function main() {
  const user = await prisma.user.findFirst();
  console.log('findFirst result:', user);
  if (user !== null) {
    throw new Error('Expected null on empty DB.');
  }
  console.log('OK — DB reachable, schema deployed, User table empty.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
