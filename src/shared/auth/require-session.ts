import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from './auth';

/**
 * Server-side page guard: returns the Better Auth session or redirects to
 * `/login` when unauthenticated. Use in page/layout server components (where a
 * redirect is the right UX) — API handlers use `getCurrentUser` (→ 401).
 */
export async function requireSession() {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session) redirect('/login');
  return session;
}
