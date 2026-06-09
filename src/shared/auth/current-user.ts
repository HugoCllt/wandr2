import { headers } from 'next/headers';

import { prisma } from '../db/prisma';
import { auth } from './auth';

/** Thrown when no authenticated session backs the request. Mapped to 401. */
export class NotAuthenticatedError extends Error {
  constructor() {
    super('Not authenticated');
    this.name = 'NotAuthenticatedError';
  }
}

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  cityId: string;
  isPremium: boolean;
  onboardedAt: Date | null;
};

/**
 * Resolves the authenticated user from the Better Auth DB session. Throws
 * `NotAuthenticatedError` (→ 401) when there is no session. No caching, no
 * seed-email fallback: every request is scoped to its own session.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session?.user) throw new NotAuthenticatedError();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      cityId: true,
      isPremium: true,
      onboardedAt: true,
    },
  });
  if (!user) throw new NotAuthenticatedError();

  return user;
}
