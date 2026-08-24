import { getFeaturedActivitiesRouteHandler } from '../../../../modules/activities/web/featuredRoute';
import { withRoute } from '../../_lib/withRoute';

export const dynamic = 'force-dynamic';

export const GET = withRoute(getFeaturedActivitiesRouteHandler);
