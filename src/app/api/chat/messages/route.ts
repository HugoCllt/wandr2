import { chatMessagesPostHandler } from '../../../../modules/chat/web/chatMessagesRoute';
import { route } from '../../_lib/route';

export const dynamic = 'force-dynamic';

export const POST = route(chatMessagesPostHandler);
