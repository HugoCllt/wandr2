import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { ActivityNotFoundError } from '../../../modules/activities/domain/ActivityNotFoundError';
import { CalendarEntryNotFoundError } from '../../../modules/calendar/domain/CalendarEntryNotFoundError';
import { DuplicateCalendarEntryError } from '../../../modules/calendar/domain/DuplicateCalendarEntryError';
import { MonthlyTokenLimitError } from '../../../modules/chat/domain/MonthlyTokenLimitError';
import { PremiumRequiredError } from '../../../modules/chat/domain/PremiumRequiredError';
import { NotAuthenticatedError } from '../../../shared/auth/current-user';
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
  if (error instanceof NotAuthenticatedError) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (error instanceof ActivityNotFoundError || error instanceof CalendarEntryNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof DuplicateCalendarEntryError) {
    return NextResponse.json(
      { error: 'Calendar entry already exists at this time' },
      { status: 409 },
    );
  }
  if (error instanceof PremiumRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof MonthlyTokenLimitError) {
    return NextResponse.json({ error: error.message }, { status: 429 });
  }

  logger.error({ error }, 'Unhandled API error');
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
