import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '../../../shared/obs/logger';

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Invalid request body',
        issues: error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  logger.error({ error }, 'Unhandled API error');
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
