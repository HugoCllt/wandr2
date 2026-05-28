import { postAdminActivity } from '../../../../modules/activities/web/adminActivityRoute';
import { withRoute } from '../../_lib/withRoute';

export const dynamic = 'force-dynamic';

export const POST = withRoute(postAdminActivity);
