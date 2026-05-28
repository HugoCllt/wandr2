import { route } from '../../_lib/route';
import { favoritesFeedRouteHandler } from '../../../../modules/favorites/web/favoritesFeedRoute';

export const dynamic = 'force-dynamic';

export const GET = route(favoritesFeedRouteHandler);
