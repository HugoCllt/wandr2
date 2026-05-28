import { postAdminActivity } from '../../../../modules/activities/web/adminActivityRoute';
import { route } from '../../_lib/route';

export const dynamic = 'force-dynamic';

export const POST = route(postAdminActivity);
