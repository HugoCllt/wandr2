import { route } from '../_lib/route';
import { toggleFavoriteRouteHandler } from '../../../modules/favorites/web/favoritesRoute';

export const dynamic = 'force-dynamic';

export const POST = route(toggleFavoriteRouteHandler);
