import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

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

export type SendChatMessageOutput = {
  text: string;
  usage: TokenUsage;
};

export type SendChatMessageDeps = {
  model: BaseChatModel;
  usage: IChatUsageRepository;
  monthlyTokenCap: number;
};

const ZERO_USAGE: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

export class SendChatMessageUseCase {
  constructor(private readonly deps: SendChatMessageDeps) {}

  async execute(input: SendChatMessageInput): Promise<SendChatMessageOutput> {
    const { model, usage, monthlyTokenCap } = this.deps;

    const spent = await usage.getMonthlyTotal(input.userId, input.month);
    if (spent >= monthlyTokenCap) {
      throw new MonthlyTokenLimitError();
    }

    const messages = [
      new SystemMessage(CHAT_SYSTEM_PROMPT),
      ...input.history.map((turn) =>
        turn.role === 'user' ? new HumanMessage(turn.content) : new AIMessage(turn.content),
      ),
      new HumanMessage(input.text),
    ];

    const graph = buildChatGraph(model);
    const result = await graph.invoke({ messages });

    const last = result.messages.at(-1);
    const text = last ? String(last.content) : '';

    // Ollama's OpenAI-compatible endpoint may omit usage; fall back to zeros.
    const meta = (last as AIMessage | undefined)?.usage_metadata;
    const used: TokenUsage = meta
      ? {
          promptTokens: meta.input_tokens ?? 0,
          completionTokens: meta.output_tokens ?? 0,
          totalTokens: meta.total_tokens ?? 0,
        }
      : ZERO_USAGE;

    await usage.addUsage(input.userId, input.month, used);

    return { text, usage: used };
  }
}
