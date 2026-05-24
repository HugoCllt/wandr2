export type ChatMessageRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  threadId: string;
  role: ChatMessageRole;
  text: string;
  suggestedActivityIds: string[];
  createdAt: Date;
};
