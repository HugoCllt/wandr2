import { deleteCalendarEntryRouteHandler } from '../../../../modules/calendar/web/calendarEntryRoute';
import { withRoute } from '../../_lib/withRoute';

export const dynamic = 'force-dynamic';

export const DELETE = withRoute(deleteCalendarEntryRouteHandler);
