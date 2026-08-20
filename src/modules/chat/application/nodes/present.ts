import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { ChatCustomEvent, ChatStateType } from '../chatState';
import { lastUserText, streamReply } from './helpers';
import { presentPrompt } from '../prompts';

/**
 * Emits the finished cards on the `custom` channel, then streams a short French
 * intro (its tokens reach the client — with `converse` the only ones that do).
 * Honest copy when there are fewer than three cards, or none.
 */
export function makePresentNode(model: BaseChatModel) {
  return async (
    state: ChatStateType,
    config: LangGraphRunnableConfig,
  ): Promise<Partial<ChatStateType>> => {
    const items = state.recommendations ?? [];
    config.writer?.({ kind: 'recommendations', items } satisfies ChatCustomEvent);

    const messages = [
      new SystemMessage(presentPrompt(items.length, state.city.name)),
      new HumanMessage(lastUserText(state.messages)),
    ];
    const { message, usage } = await streamReply(model, messages, config);
    return { messages: [message], usage };
  };
}
