import { handleApiError } from '../_lib/error-handler';
import { feedRouteHandler } from '../../../modules/feed/web/feedRoute';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return await feedRouteHandler(url.searchParams);
  } catch (error) {
    return handleApiError(error);
  }
}
