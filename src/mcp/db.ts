import { PrismaClient } from '@prisma/client';

import { logger } from './logger';

// Dedicated client for the MCP process. We do NOT reuse src/shared/db/prisma.ts:
// its string-form log (['warn','error']) writes to stdout, which corrupts the
// stdio JSON-RPC stream. Event-based logging keeps every Prisma line on stderr.
export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

prisma.$on('warn', (event) => logger.warn({ prisma: event.message }));
prisma.$on('error', (event) => logger.error({ prisma: event.message }));
