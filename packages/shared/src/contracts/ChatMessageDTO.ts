import type { ActivityDTO } from './ActivityDTO';
import type { ChatRecommendationDTO } from './ChatRecommendationDTO';

export type ChatMessageRoleDTO = 'user' | 'assistant';

export type ChatMessageDTO = {
  id: string;
  role: ChatMessageRoleDTO;
  text: string;
  suggestedActivities: ActivityDTO[];
  /** Activity cards the assistant attached to this turn (recommendation flow). */
  recommendations: ChatRecommendationDTO[];
  createdAt: string;
};
