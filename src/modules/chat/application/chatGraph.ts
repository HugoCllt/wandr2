import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { END, START, StateGraph } from '@langchain/langgraph';

import type { IRecommendationContextRepository } from '../domain/IRecommendationContextRepository';
import type { IWebSearchProvider } from '../domain/IWebSearchProvider';
import { ChatState, type ChatStateType } from './chatState';
import { makeConverseNode } from './nodes/converse';
import { makePresentNode } from './nodes/present';
import { makeProfileNode } from './nodes/profile';
import { makeRouterNode } from './nodes/router';
import { makeSearchNode } from './nodes/search';
import { makeStrategyNode } from './nodes/strategy';
import { makeSynthesizeNode } from './nodes/synthesize';

export type ChatGraphDeps = {
  model: BaseChatModel;
  contextRepo: IRecommendationContextRepository;
  webSearch: IWebSearchProvider;
};

/**
 * The deterministic multi-agent recommendation graph (plan-execute / deep-research
 * shape, adapted to a small local model — JSON-mode structured calls, no
 * tool-calling). `router` and `profile` run in the same superstep: the profile
 * is a cheap DB read that `strategy` needs, so it loads while the router's LLM
 * call is in flight (wasted on the clarify path — see tbd.md). BSP semantics
 * guarantee `profile` has finished before `strategy` starts.
 *
 * ```
 * START → router ─(clarify)→  converse → END
 *       ↘        ─(recommend)→ strategy → search → synthesize → present → END
 *         profile → END                ↑ (profile's userContext, via state)
 * ```
 */
export function buildChatGraph(deps: ChatGraphDeps) {
  const { model, contextRepo, webSearch } = deps;

  return new StateGraph(ChatState)
    .addNode('router', makeRouterNode(model))
    .addNode('converse', makeConverseNode(model))
    .addNode('profile', makeProfileNode(contextRepo))
    .addNode('strategy', makeStrategyNode(model))
    .addNode('search', makeSearchNode(webSearch))
    .addNode('synthesize', makeSynthesizeNode(model))
    .addNode('present', makePresentNode(model))
    .addEdge(START, 'router')
    .addEdge(START, 'profile')
    .addConditionalEdges('router', (state: ChatStateType) =>
      state.route === 'recommend' ? 'strategy' : 'converse',
    )
    .addEdge('profile', END)
    .addEdge('converse', END)
    .addEdge('strategy', 'search')
    .addEdge('search', 'synthesize')
    .addEdge('synthesize', 'present')
    .addEdge('present', END)
    .compile();
}
