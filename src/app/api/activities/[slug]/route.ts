import { withRoute } from '../../_lib/withRoute';
import { getActivityDetailRouteHandler } from './detailHandler';

export const dynamic = 'force-dynamic';

export const GET = withRoute(getActivityDetailRouteHandler);
