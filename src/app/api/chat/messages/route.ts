import { chatMessagesPostHandler } from '../../../../modules/chat/web/chatMessagesRoute';
import { withRoute } from '../../_lib/withRoute';

export const dynamic = 'force-dynamic';

export const POST = withRoute(chatMessagesPostHandler);
