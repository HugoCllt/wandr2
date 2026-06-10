import type { IRecommendationContextRepository } from '../../domain/IRecommendationContextRepository';
import type { ChatStateType } from '../chatState';

/**
 * Reads the user's long-term memory (bio, affinities, favorites, history) from
 * the DB — no LLM. Runs in parallel with `router`, so it emits no phase (the
 * indicator would flip while the route is still undecided); `strategy` opens
 * "reflecting".
 */
export function makeProfileNode(contextRepo: IRecommendationContextRepository) {
  return async (state: ChatStateType): Promise<Partial<ChatStateType>> => {
    const userContext = await contextRepo.load(state.userId, state.cityId);
    return { userContext };
  };
}
