import { toNextJsHandler } from 'better-auth/next-js';

import { auth } from '../../../../shared/auth/auth';

// Better Auth owns the whole auth edge (sign-up/in/out, sessions) and manages
// its own HTTP errors — no withRoute wrapper here.
export const { GET, POST } = toNextJsHandler(auth.handler);
