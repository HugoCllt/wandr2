import {
  addToCalendarRouteHandler,
  listCalendarEntriesRouteHandler,
} from '../../../modules/calendar/web/calendarRoute';
import { handleApiError } from '../_lib/error-handler';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    return await addToCalendarRouteHandler(request);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    return await listCalendarEntriesRouteHandler(request);
  } catch (error) {
    return handleApiError(error);
  }
}
