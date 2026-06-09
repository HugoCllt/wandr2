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
 * tool-calling). The `router` forks: `clarify` streams a reply via `converse`;
 * `recommend` runs profile → strategy → search → synthesize → present, with
 * context isolated per axis until synthesis.
 *
 * ```
 * START → router ─(clarify)→  converse → END
 *                ─(recommend)→ profile → strategy → search → synthesize → present → END
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
    .addConditionalEdges('router', (state: ChatStateType) =>
      state.route === 'recommend' ? 'profile' : 'converse',
    )
    .addEdge('converse', END)
    .addEdge('profile', 'strategy')
    .addEdge('strategy', 'search')
    .addEdge('search', 'synthesize')
    .addEdge('synthesize', 'present')
    .addEdge('present', END)
    .compile();
}
