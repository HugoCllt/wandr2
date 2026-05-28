import {
  addToCalendarRouteHandler,
  listCalendarEntriesRouteHandler,
} from '../../../modules/calendar/web/calendarRoute';
import { withRoute } from '../_lib/withRoute';

export const dynamic = 'force-dynamic';

export const POST = withRoute(addToCalendarRouteHandler);
export const GET = withRoute(listCalendarEntriesRouteHandler);
