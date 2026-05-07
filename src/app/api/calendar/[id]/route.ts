import { deleteCalendarEntryRouteHandler } from '../../../../modules/calendar/web/calendarEntryRoute';
import { handleApiError } from '../../_lib/error-handler';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    return await deleteCalendarEntryRouteHandler(request, context);
  } catch (error) {
    return handleApiError(error);
  }
}
