import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  AIMessage,
  type AIMessageChunk,
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { concat } from '@langchain/core/utils/stream';

import type { ChatStreamEvent } from '../../../shared/contracts/ChatStreamEvent';
import type { IChatUsageRepository } from '../domain/IChatUsageRepository';
import { MonthlyTokenLimitError } from '../domain/MonthlyTokenLimitError';
import type { TokenUsage } from '../domain/TokenUsage';
import { buildChatGraph } from './chatGraph';
import { CHAT_SYSTEM_PROMPT } from './chatSystemPrompt';

/** One past exchange replayed to the model (conversation memory lives client-side). */
export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export type SendChatMessageInput = {
  userId: string;
  month: string;
  text: string;
  history: ChatTurn[];
};

export type SendChatMessageDeps = {
  model: BaseChatModel;
  usage: IChatUsageRepository;
  monthlyTokenCap: number;
};

const ZERO_USAGE: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

/**
 * The exact message list the model sees each turn: the system prompt heads it,
 * the replayed client thread follows, the new turn closes it. Pure so the
 * conversation shape can be asserted without driving the model.
 */
export function buildChatMessages(history: ChatTurn[], text: string): BaseMessage[] {
  return [
    new SystemMessage(CHAT_SYSTEM_PROMPT),
    ...history.map((turn) =>
      turn.role === 'user' ? new HumanMessage(turn.content) : new AIMessage(turn.content),
    ),
    new HumanMessage(text),
  ];
}

/** Ollama's OpenAI-compatible endpoint may omit usage; fall back to zeros. */
function toTokenUsage(meta: AIMessageChunk['usage_metadata'] | undefined): TokenUsage {
  return meta
    ? {
        promptTokens: meta.input_tokens ?? 0,
        completionTokens: meta.output_tokens ?? 0,
        totalTokens: meta.total_tokens ?? 0,
      }
    : ZERO_USAGE;
}

export class SendChatMessageUseCase {
  constructor(private readonly deps: SendChatMessageDeps) {}

  /**
   * Streams the assistant turn as it is produced: a `thinking` status until the
   * first answer token, then `writing` + `token`s, then `done`. The monthly cap
   * is enforced first (throws before any event), so the route can surface it as
   * an HTTP error before the stream body opens. Token usage is accumulated from
   * the streamed chunks (real models carry it on the final chunk; absent → 0)
   * and persisted before `done`.
   */
  async *executeStream(input: SendChatMessageInput): AsyncGenerator<ChatStreamEvent> {
    const { model, usage, monthlyTokenCap } = this.deps;

    const spent = await usage.getMonthlyTotal(input.userId, input.month);
    if (spent >= monthlyTokenCap) {
      throw new MonthlyTokenLimitError();
    }

    yield { type: 'status', phase: 'thinking' };

    const messages = buildChatMessages(input.history, input.text);
    const graph = buildChatGraph(model);

    let acc: AIMessageChunk | undefined;
    let writing = false;
    // `streamMode: 'messages'` yields one `[chunk, metadata]` per model token,
    // even though the graph node calls `model.invoke` (LangGraph upgrades it).
    const stream = await graph.stream({ messages }, { streamMode: 'messages' });
    for await (const [chunk] of stream) {
      const part = chunk as AIMessageChunk;
      acc = acc ? concat(acc, part) : part;
      const text = typeof part.content === 'string' ? part.content : '';
      if (text.length === 0) continue; // reasoning / tool latency — stay 'thinking'
      if (!writing) {
        writing = true;
        yield { type: 'status', phase: 'writing' };
      }
      yield { type: 'token', text };
    }

    await usage.addUsage(input.userId, input.month, toTokenUsage(acc?.usage_metadata));
    yield { type: 'done' };
  }
}
