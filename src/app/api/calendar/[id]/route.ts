import {
  deleteCalendarEntryRouteHandler,
  reviewCalendarEntryRouteHandler,
} from '../../../../modules/calendar/web/calendarEntryRoute';
import { withRoute } from '../../_lib/withRoute';

export const dynamic = 'force-dynamic';

export const DELETE = withRoute(deleteCalendarEntryRouteHandler);
export const PATCH = withRoute(reviewCalendarEntryRouteHandler);
