import { handleApiError } from '../../_lib/error-handler';
import { postAdminActivity } from '../../../../modules/activities/web/adminActivityRoute';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    return await postAdminActivity(request);
  } catch (error) {
    return handleApiError(error);
  }
}
