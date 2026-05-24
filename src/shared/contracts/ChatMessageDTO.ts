import type { ActivityDTO } from './ActivityDTO';

export type ChatMessageRoleDTO = 'user' | 'assistant';

export type ChatMessageDTO = {
  id: string;
  role: ChatMessageRoleDTO;
  text: string;
  suggestedActivities: ActivityDTO[];
  createdAt: string;
};
