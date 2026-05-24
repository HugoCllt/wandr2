import type { ChatMessage } from '../domain/ChatMessage';
import type { ChatThread } from '../domain/ChatThread';
import type { IChatRepository } from '../domain/IChatRepository';

export class MockChatRepository implements IChatRepository {
  async getThreadForUser(userId: string): Promise<ChatThread> {
    return {
      id: `thread-${userId}`,
      userId,
      messages: [],
    };
  }

  async appendMessage(_message: ChatMessage): Promise<void> {
    // No-op: mock repo does not persist; client owns the visible thread state.
  }
}
