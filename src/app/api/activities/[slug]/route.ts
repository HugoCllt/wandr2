import { handleApiError } from '../../_lib/error-handler';
import { getActivityBySlug } from '../../../../modules/activities/web/activityDetailRoute';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  try {
    return await getActivityBySlug(params.slug);
  } catch (error) {
    return handleApiError(error);
  }
}
