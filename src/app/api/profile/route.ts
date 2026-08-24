import { withRoute } from '../_lib/withRoute';
import {
  getProfileRouteHandler,
  updateProfileRouteHandler,
} from '../../../modules/profile/web/profileRoute';

export const dynamic = 'force-dynamic';

export const GET = withRoute(getProfileRouteHandler);
export const PATCH = withRoute(updateProfileRouteHandler);
