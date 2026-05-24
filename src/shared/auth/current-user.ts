import { env } from '../config/env';
import { prisma } from '../db/prisma';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  cityId: string;
};

let cached: CurrentUser | null = null;

export async function getCurrentUser(): Promise<CurrentUser> {
  if (cached) return cached;
  const user = await prisma.user.findUnique({
    where: { email: env.SEED_USER_EMAIL },
    select: { id: true, email: true, name: true, cityId: true },
  });
  if (!user) {
    throw new Error(
      `Seed user with email ${env.SEED_USER_EMAIL} was not found. Run \`pnpm db:seed\`.`,
    );
  }
  cached = user;
  return user;
}
