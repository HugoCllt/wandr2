import { getNeighborhoodsRouteHandler } from '../../../modules/activities/web/neighborhoodsRoute';
import { withRoute } from '../_lib/withRoute';

export const dynamic = 'force-dynamic';

export const GET = withRoute(getNeighborhoodsRouteHandler);
