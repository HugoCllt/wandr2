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
  /** Display name of the profile city (`cityId`), for read-only labels. */
  cityName: string;
  /** Slug of the profile city (`cityId`), for city-resolution fallback. */
  citySlug: string;
  isPremium: boolean;
  onboardedAt: Date | null;
};

/**
 * Resolves the authenticated user from the Better Auth DB session, or `null`
 * when there is no session. Use this where anonymous browsing is allowed
 * (the public feed pages); use `getCurrentUser` where a user is required.
 */
export async function getOptionalUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      cityId: true,
      city: { select: { name: true, slug: true } },
      isPremium: true,
      onboardedAt: true,
    },
  });
  return user ? { ...user, cityName: user.city.name, citySlug: user.city.slug } : null;
}

/**
 * Resolves the authenticated user from the Better Auth DB session. Throws
 * `NotAuthenticatedError` (→ 401) when there is no session. No caching, no
 * seed-email fallback: every request is scoped to its own session.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const user = await getOptionalUser();
  if (!user) throw new NotAuthenticatedError();
  return user;
}
