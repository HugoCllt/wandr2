import type { ChatMessage } from './ChatMessage';
import type { ChatThread } from './ChatThread';

export interface IChatRepository {
  getThreadForUser(userId: string): Promise<ChatThread>;
  appendMessage(message: ChatMessage): Promise<void>;
}
