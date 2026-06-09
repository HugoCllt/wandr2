import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';

import { ROUTER_PROMPT } from '../prompts';
import type { ChatStateType } from '../chatState';
import { structuredCall } from '../structuredCall';
import { conversationOnly } from './helpers';

const RouterSchema = z.object({ action: z.enum(['clarify', 'recommend']) });

/**
 * Classifies the turn: stream a reply / clarifying question (`clarify`) or run
 * the recommendation pipeline (`recommend`). On a structured-call failure it
 * defaults to `clarify` — asking a question is the safe fallback.
 */
export function makeRouterNode(model: BaseChatModel) {
  return async (state: ChatStateType): Promise<Partial<ChatStateType>> => {
    const messages = [new SystemMessage(ROUTER_PROMPT), ...conversationOnly(state.messages)];
    try {
      const { value, usage } = await structuredCall(model, messages, RouterSchema);
      return { route: value.action, usage };
    } catch {
      return { route: 'clarify' };
    }
  };
}
