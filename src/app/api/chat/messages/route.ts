import { handleApiError } from '../../_lib/error-handler';
import { chatMessagesPostHandler } from '../../../../modules/chat/web/chatMessagesRoute';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    return await chatMessagesPostHandler(request);
  } catch (error) {
    return handleApiError(error);
  }
}
