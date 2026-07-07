import { postAgentArchive } from '../../../../../../modules/activities/web/agentApiRoutes';
import { withRoute } from '../../../../_lib/withRoute';

export const dynamic = 'force-dynamic';

export const POST = withRoute(postAgentArchive);
