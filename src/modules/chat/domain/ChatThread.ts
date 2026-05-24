import type { ChatMessage } from './ChatMessage';

export type ChatThread = {
  id: string;
  userId: string;
  messages: ChatMessage[];
};
