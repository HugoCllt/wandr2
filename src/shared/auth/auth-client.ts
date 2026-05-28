'use client';

import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth browser client. Reads `NEXT_PUBLIC_BETTER_AUTH_URL` directly
 * (not via `env.ts`, which is server-only) — when unset, Better Auth falls
 * back to the current origin.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
