import type { ChatMessageDTO } from './ChatMessageDTO';

export type ChatThreadDTO = {
  id: string;
  messages: ChatMessageDTO[];
};
