import type { ChatThread } from '../domain/ChatThread';
import type { IChatRepository } from '../domain/IChatRepository';

export class GetChatStateUseCase {
  constructor(private readonly chats: IChatRepository) {}

  async execute(userId: string): Promise<ChatThread> {
    return this.chats.getThreadForUser(userId);
  }
}
