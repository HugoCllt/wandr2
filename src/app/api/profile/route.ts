import { withRoute } from '../_lib/withRoute';
import { updateProfileRouteHandler } from '../../../modules/profile/web/profileRoute';

export const dynamic = 'force-dynamic';

export const PATCH = withRoute(updateProfileRouteHandler);
