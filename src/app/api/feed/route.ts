import { route } from '../_lib/route';
import { feedRouteHandler } from '../../../modules/feed/web/feedRoute';

export const dynamic = 'force-dynamic';

export const GET = route(feedRouteHandler);
