import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { env } from '../config/env';
import { prisma } from '../db/prisma';
import { logger } from '../obs/logger';

const googleConfigured = !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET;

if (!googleConfigured) {
  logger.warn('Google OAuth not configured (GOOGLE_CLIENT_ID/SECRET empty) — Google sign-in disabled.');
}

/**
 * Better Auth instance — owns the whole HTTP auth edge (sign-up, sign-in,
 * sign-out, sessions) at `/api/auth/[...all]`. DB sessions (table `Session`)
 * give instant server-side logout for both Credentials and Google.
 *
 * Lives in `shared/auth/` (cross-cutting config, allowed to touch Prisma like
 * `shared/db/`). The only importers are `shared/auth/current-user.ts` and the
 * `[...all]` route handler — modules never import it directly.
 */
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  trustedOrigins: ['wandr://'],
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {},
  user: {
    // Our domain fields live on the same User row. They are filled by the
    // onboarding flow / databaseHooks, never by client input.
    additionalFields: {
      cityId: { type: 'string', input: false, required: false },
      onboardedAt: { type: 'date', input: false, required: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Single mechanism for both OAuth and Credentials: inject the only
        // seeded city (Montréal) so the NOT NULL `cityId` is always satisfied.
        before: async (user) => {
          const montreal = await prisma.city.findUnique({ where: { slug: 'montreal' } });
          if (!montreal) throw new Error('Montréal city missing — run `pnpm db:seed` first.');
          return { data: { ...user, cityId: montreal.id } };
        },
      },
    },
  },
  plugins: [expo()],
});
