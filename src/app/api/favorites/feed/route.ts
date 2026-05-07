import { handleApiError } from '../../_lib/error-handler';
import { favoritesFeedRouteHandler } from '../../../../modules/favorites/web/favoritesFeedRoute';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return await favoritesFeedRouteHandler(url.searchParams);
  } catch (error) {
    return handleApiError(error);
  }
}
