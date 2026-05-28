import { getActivityBySlugHandler } from '../../../../modules/activities/web/activityDetailRoute';
import { route } from '../../_lib/route';

export const dynamic = 'force-dynamic';

export const GET = route(getActivityBySlugHandler);
