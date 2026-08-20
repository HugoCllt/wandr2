import { selectCityRouteHandler } from '../../../modules/activities/web/cityRoute';
import { withRoute } from '../_lib/withRoute';

export const dynamic = 'force-dynamic';

export const POST = withRoute(selectCityRouteHandler);
