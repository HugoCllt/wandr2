import { withRoute } from '../_lib/withRoute';
import { toggleFavoriteRouteHandler } from '../../../modules/favorites/web/favoritesRoute';

export const dynamic = 'force-dynamic';

export const POST = withRoute(toggleFavoriteRouteHandler);
