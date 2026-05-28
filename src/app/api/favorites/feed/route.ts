import { withRoute } from '../../_lib/withRoute';
import { favoritesFeedRouteHandler } from '../../../../modules/favorites/web/favoritesFeedRoute';

export const dynamic = 'force-dynamic';

export const GET = withRoute(favoritesFeedRouteHandler);
