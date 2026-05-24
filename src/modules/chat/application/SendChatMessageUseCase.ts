import type { ChatMessage } from '../domain/ChatMessage';
import type { IChatProvider } from '../domain/IChatProvider';
import type { IChatRepository } from '../domain/IChatRepository';

export type SendChatMessageInput = {
  userId: string;
  threadId: string;
  text: string;
};

export type SendChatMessageOutput = {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
};

function newId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class SendChatMessageUseCase {
  constructor(
    private readonly chats: IChatRepository,
    private readonly provider: IChatProvider,
  ) {}

  async execute(input: SendChatMessageInput): Promise<SendChatMessageOutput> {
    const trimmed = input.text.trim();
    if (trimmed.length === 0) {
      throw new Error('Message text is required.');
    }

    const userMessage: ChatMessage = {
      id: newId(),
      threadId: input.threadId,
      role: 'user',
      text: trimmed,
      suggestedActivityIds: [],
      createdAt: new Date(),
    };
    await this.chats.appendMessage(userMessage);

    const reply = await this.provider.reply({ userMessage: trimmed, userId: input.userId });

    const assistantMessage: ChatMessage = {
      id: newId(),
      threadId: input.threadId,
      role: 'assistant',
      text: reply.text,
      suggestedActivityIds: reply.suggestedActivityIds,
      createdAt: new Date(),
    };
    await this.chats.appendMessage(assistantMessage);

    return { userMessage, assistantMessage };
  }
}
