import { withRoute } from '../_lib/withRoute';
import { feedRouteHandler } from '../../../modules/feed/web/feedRoute';

export const dynamic = 'force-dynamic';

export const GET = withRoute(feedRouteHandler);
