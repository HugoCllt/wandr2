import {
  addToCalendarRouteHandler,
  listCalendarEntriesRouteHandler,
} from '../../../modules/calendar/web/calendarRoute';
import { route } from '../_lib/route';

export const dynamic = 'force-dynamic';

export const POST = route(addToCalendarRouteHandler);
export const GET = route(listCalendarEntriesRouteHandler);
