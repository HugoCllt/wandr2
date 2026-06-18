import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, type BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import type { ChatStreamEvent } from '../../../shared/contracts/ChatStreamEvent';
import type { IChatUsageRepository } from '../domain/IChatUsageRepository';
import type { IRecommendationContextRepository } from '../domain/IRecommendationContextRepository';
import type { IWebSearchProvider } from '../domain/IWebSearchProvider';
import { MonthlyTokenLimitError } from '../domain/MonthlyTokenLimitError';
import type { TokenUsage } from '../domain/TokenUsage';
import { buildChatGraph } from './chatGraph';
import type { ChatCustomEvent, ChatStateType } from './chatState';
import { CHAT_SYSTEM_PROMPT } from './chatSystemPrompt';
import { ZERO_USAGE } from './tokenUsage';

/** One past exchange replayed to the model (conversation memory lives client-side). */
export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export type SendChatMessageInput = {
  userId: string;
  cityId: string;
  month: string;
  text: string;
  /** Input-toggle context (near me / tonight / solo) folded into the turn. */
  context?: string;
  history: ChatTurn[];
  /** Aborts the in-flight graph run (client gone) — tokens stop burning. */
  signal?: AbortSignal;
};

/** Replay at most this many past messages (~ the last 6 exchanges) so a long
 * conversation doesn't inflate every LLM call of the pipeline. */
const MAX_HISTORY_MESSAGES = 12;

export type SendChatMessageDeps = {
  model: BaseChatModel;
  usage: IChatUsageRepository;
  contextRepo: IRecommendationContextRepository;
  webSearch: IWebSearchProvider;
  monthlyTokenCap: number;
};

/**
 * The exact message list the recommendation graph starts from: the system
 * prompt heads it, the replayed client thread follows (bounded to the most
 * recent `MAX_HISTORY_MESSAGES`), the new turn closes it. Pure so the
 * conversation shape can be asserted without driving the model.
 */
export function buildChatMessages(
  history: ChatTurn[],
  text: string,
  context?: string,
): BaseMessage[] {
  return [
    new SystemMessage(CHAT_SYSTEM_PROMPT),
    ...history
      .slice(-MAX_HISTORY_MESSAGES)
      .map((turn) =>
        turn.role === 'user' ? new HumanMessage(turn.content) : new AIMessage(turn.content),
      ),
    new HumanMessage(context ? `${text}\n\n${context}` : text),
  ];
}

export class SendChatMessageUseCase {
  /** Compiled once per use-case instance — the graph shape never changes per turn. */
  private readonly graph: ReturnType<typeof buildChatGraph>;

  constructor(private readonly deps: SendChatMessageDeps) {
    this.graph = buildChatGraph({
      model: deps.model,
      contextRepo: deps.contextRepo,
      webSearch: deps.webSearch,
    });
  }

  /**
   * Drives the recommendation graph and re-emits its progress as the wire event
   * stream: an initial `thinking` status, then the graph's phase changes
   * (`reflecting`/`searching`/`synthesizing`), the answer `token`s, an optional
   * `recommendations` payload, and finally `done`. Everything the client sees
   * flows through the graph's `custom` channel (token streaming via the
   * `messages` channel proved lossy deep in the multi-node graph); the `values`
   * channel carries the summed `usage`. The monthly cap is enforced first
   * (throws before any event) so the route can surface it as an HTTP error
   * before the body opens. Usage is persisted before `done`.
   */
  async *executeStream(input: SendChatMessageInput): AsyncGenerator<ChatStreamEvent> {
    const { usage, monthlyTokenCap } = this.deps;

    const spent = await usage.getMonthlyTotal(input.userId, input.month);
    if (spent >= monthlyTokenCap) {
      throw new MonthlyTokenLimitError();
    }

    yield { type: 'status', phase: 'thinking' };

    const initial = {
      messages: buildChatMessages(input.history, input.text, input.context),
      userId: input.userId,
      cityId: input.cityId,
    };

    let writing = false;
    let total: TokenUsage = ZERO_USAGE;

    const stream = await this.graph.stream(initial, {
      streamMode: ['custom', 'values'],
      signal: input.signal,
    });

    for await (const [mode, payload] of stream) {
      if (mode === 'custom') {
        const event = payload as ChatCustomEvent;
        if (event.kind === 'phase') {
          yield { type: 'status', phase: event.phase };
        } else if (event.kind === 'recommendations') {
          yield { type: 'recommendations', items: event.items };
        } else {
          // First answer token flips the status from its current phase to writing.
          if (!writing) {
            writing = true;
            yield { type: 'status', phase: 'writing' };
          }
          yield { type: 'token', text: event.text };
        }
      } else if (mode === 'values') {
        const state = payload as ChatStateType;
        if (state.usage) total = state.usage;
      }
    }

    await usage.addUsage(input.userId, input.month, total);
    yield { type: 'done' };
  }
}
