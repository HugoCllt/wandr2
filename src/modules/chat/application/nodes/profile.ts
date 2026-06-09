import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { IRecommendationContextRepository } from '../../domain/IRecommendationContextRepository';
import type { ChatCustomEvent, ChatStateType } from '../chatState';

/**
 * Reads the user's long-term memory (bio, affinities, favorites, history) from
 * the DB — no LLM. Opens the "reflecting" phase.
 */
export function makeProfileNode(contextRepo: IRecommendationContextRepository) {
  return async (
    state: ChatStateType,
    config: LangGraphRunnableConfig,
  ): Promise<Partial<ChatStateType>> => {
    config.writer?.({ kind: 'phase', phase: 'reflecting' } satisfies ChatCustomEvent);
    const userContext = await contextRepo.load(state.userId, state.cityId);
    return { userContext };
  };
}
