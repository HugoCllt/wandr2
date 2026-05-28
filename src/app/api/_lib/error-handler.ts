import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { ActivityNotFoundError } from '../../../modules/activities/domain/ActivityNotFoundError';
import { DuplicateCalendarEntryError } from '../../../modules/calendar/domain/DuplicateCalendarEntryError';
import { logger } from '../../../shared/obs/logger';

/**
 * Single error→HTTP-status seam for the whole API. Domain errors throw out of
 * use cases; `route()` catches them here and decides the status. Anything not
 * listed maps to 500 (unexpected = bug). HTTP knowledge stays in this file
 * (CLAUDE.md §6: domain forbidden from knowing HTTP).
 *
 * Adding a domain error with a non-500 status = one entry below.
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Invalid request', issues: error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  if (error instanceof ActivityNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof DuplicateCalendarEntryError) {
    return NextResponse.json(
      { error: 'Calendar entry already exists at this time' },
      { status: 409 },
    );
  }

  logger.error({ error }, 'Unhandled API error');
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
