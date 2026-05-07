import { handleApiError } from '../_lib/error-handler';
import { toggleFavoriteRouteHandler } from '../../../modules/favorites/web/favoritesRoute';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    return await toggleFavoriteRouteHandler(request);
  } catch (error) {
    return handleApiError(error);
  }
}
