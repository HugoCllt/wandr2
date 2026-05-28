import { deleteCalendarEntryRouteHandler } from '../../../../modules/calendar/web/calendarEntryRoute';
import { route } from '../../_lib/route';

export const dynamic = 'force-dynamic';

export const DELETE = route(deleteCalendarEntryRouteHandler);
