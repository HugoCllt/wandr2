import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph';

/**
 * Minimal LangGraph `StateGraph`: a single `model` node that answers the
 * running message list. Built as the extension base — tomorrow this grows a
 * `tools` node + a conditional `model → tools → model` edge (with
 * `model.bindTools(...)`) once web-search / DB-read tools exist.
 */
export function buildChatGraph(model: BaseChatModel) {
  return new StateGraph(MessagesAnnotation)
    .addNode('model', async (state) => ({ messages: [await model.invoke(state.messages)] }))
    .addEdge(START, 'model')
    .addEdge('model', END)
    .compile();
}
