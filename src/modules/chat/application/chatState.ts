import { Annotation, MessagesAnnotation } from '@langchain/langgraph';

import type { ChatRecommendationDTO } from '../../../shared/contracts/ChatRecommendationDTO';
import type { ChatStreamPhase } from '../../../shared/contracts/ChatStreamEvent';
import type { SearchAxis } from '../domain/SearchAxis';
import type { TokenUsage } from '../domain/TokenUsage';
import type { UserRecommendationContext } from '../domain/UserRecommendationContext';
import type { WebSearchResult } from '../domain/WebSearchResult';
import { addTokenUsage, ZERO_USAGE } from './tokenUsage';

/**
 * Custom-channel payloads the nodes emit via `config.writer`, surfaced by the
 * graph's `'custom'` stream mode. `phase` drives the status indicator;
 * `recommendations` carries the finished cards.
 */
export type ChatCustomEvent =
  | { kind: 'phase'; phase: ChatStreamPhase }
  | { kind: 'token'; text: string }
  | { kind: 'recommendations'; items: ChatRecommendationDTO[] };

/**
 * State of the recommendation graph. Reducers are deliberate: `messages`
 * accumulates (`MessagesAnnotation.spec`), `usage` sums across the pipeline's
 * LLM calls, every other channel overwrites (default reducer).
 */
export const ChatState = Annotation.Root({
  ...MessagesAnnotation.spec,
  userId: Annotation<string>,
  cityId: Annotation<string>,
  route: Annotation<'clarify' | 'recommend'>,
  userContext: Annotation<UserRecommendationContext | null>,
  axes: Annotation<SearchAxis[]>,
  searchResults: Annotation<WebSearchResult[][]>,
  recommendations: Annotation<ChatRecommendationDTO[]>,
  usage: Annotation<TokenUsage>({
    reducer: addTokenUsage,
    default: () => ZERO_USAGE,
  }),
});

export type ChatStateType = typeof ChatState.State;
