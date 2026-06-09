import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { ChatStateType } from '../chatState';
import { streamReply } from './helpers';

/**
 * The plain-chat node: answers / asks a clarifying question over the running
 * message list (which already carries the chat system prompt). Its tokens are
 * the only ones — with `present` — the use case streams to the client.
 */
export function makeConverseNode(model: BaseChatModel) {
  return async (
    state: ChatStateType,
    config: LangGraphRunnableConfig,
  ): Promise<Partial<ChatStateType>> => {
    const { message, usage } = await streamReply(model, state.messages, config);
    return { messages: [message], usage };
  };
}
