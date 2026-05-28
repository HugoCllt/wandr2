import { getActivityBySlugHandler } from '../../../../modules/activities/web/activityDetailRoute';
import { withRoute } from '../../_lib/withRoute';

export const dynamic = 'force-dynamic';

export const GET = withRoute(getActivityBySlugHandler);
