import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, type AIMessageChunk, type BaseMessage } from '@langchain/core/messages';
import { concat } from '@langchain/core/utils/stream';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { TokenUsage } from '../../domain/TokenUsage';
import type { ChatCustomEvent } from '../chatState';
import { toTokenUsage } from '../tokenUsage';

/** The conversation without the leading chat system prompt (nodes prepend their own). */
export function conversationOnly(messages: BaseMessage[]): BaseMessage[] {
  return messages.filter((m) => m.getType() !== 'system');
}

/** Text of the most recent human turn (context for the strategy / present steps). */
export function lastUserText(messages: BaseMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.getType() === 'human') {
      return typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
    }
  }
  return '';
}

/**
 * Streams a reply token-by-token over the graph's `custom` channel — the
 * deterministic path the use case re-emits to the client. (Token streaming via
 * the `messages` channel proved lossy deep inside the multi-node graph; the
 * `custom` writer is reliable.) Returns the assembled message + its usage.
 */
export async function streamReply(
  model: BaseChatModel,
  messages: BaseMessage[],
  config: LangGraphRunnableConfig,
): Promise<{ message: AIMessage; usage: TokenUsage }> {
  let acc: AIMessageChunk | undefined;
  const stream = await model.stream(messages);
  for await (const chunk of stream) {
    acc = acc ? concat(acc, chunk) : chunk;
    const text = typeof chunk.content === 'string' ? chunk.content : '';
    if (text.length > 0) config.writer?.({ kind: 'token', text } satisfies ChatCustomEvent);
  }
  const content = typeof acc?.content === 'string' ? acc.content : '';
  return { message: new AIMessage({ content }), usage: toTokenUsage(acc?.usage_metadata) };
}
