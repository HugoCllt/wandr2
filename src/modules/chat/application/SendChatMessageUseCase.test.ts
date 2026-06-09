import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, type BaseMessage, SystemMessage } from '@langchain/core/messages';
import { describe, expect, it } from 'vitest';

import type { IChatUsageRepository } from '../domain/IChatUsageRepository';
import { MonthlyTokenLimitError } from '../domain/MonthlyTokenLimitError';
import type { TokenUsage } from '../domain/TokenUsage';
import { CHAT_SYSTEM_PROMPT } from './chatSystemPrompt';
import { SendChatMessageUseCase } from './SendChatMessageUseCase';

class FakeUsageRepository implements IChatUsageRepository {
  public readonly added: { userId: string; month: string; usage: TokenUsage }[] = [];

  constructor(private readonly totals: Record<string, number> = {}) {}

  async getMonthlyTotal(userId: string, month: string): Promise<number> {
    return this.totals[`${userId}::${month}`] ?? 0;
  }

  async addUsage(userId: string, month: string, usage: TokenUsage): Promise<void> {
    this.added.push({ userId, month, usage });
  }
}

/**
 * Minimal stand-in for a LangChain chat model: the graph only ever calls
 * `.invoke`, so we capture what it saw and return a fixed AIMessage with usage.
 */
function fakeModel(onInvoke: (messages: BaseMessage[]) => void): BaseChatModel {
  return {
    invoke: async (messages: BaseMessage[]) => {
      onInvoke(messages);
      return new AIMessage({
        content: 'Quel quartier te tente ?',
        usage_metadata: { input_tokens: 11, output_tokens: 7, total_tokens: 18 },
      });
    },
  } as unknown as BaseChatModel;
}

describe('SendChatMessageUseCase', () => {
  it('leads the model conversation with the system prompt and records usage', async () => {
    let seen: BaseMessage[] = [];
    const usage = new FakeUsageRepository();
    const useCase = new SendChatMessageUseCase({
      model: fakeModel((m) => {
        seen = m;
      }),
      usage,
      monthlyTokenCap: 100000,
    });

    const result = await useCase.execute({
      userId: 'user_1',
      month: '2026-06',
      text: 'Idée romantique ce soir',
      history: [
        { role: 'user', content: 'Salut' },
        { role: 'assistant', content: 'Bonjour ! Que cherches-tu ?' },
      ],
    });

    // System prompt heads the messages the model sees; history + new turn follow.
    expect(seen[0]).toBeInstanceOf(SystemMessage);
    expect(String(seen[0].content)).toBe(CHAT_SYSTEM_PROMPT);
    expect(seen).toHaveLength(4);
    expect(String(seen[seen.length - 1].content)).toBe('Idée romantique ce soir');

    expect(result.text).toBe('Quel quartier te tente ?');
    expect(result.usage).toEqual({ promptTokens: 11, completionTokens: 7, totalTokens: 18 });
    expect(usage.added).toEqual([
      {
        userId: 'user_1',
        month: '2026-06',
        usage: { promptTokens: 11, completionTokens: 7, totalTokens: 18 },
      },
    ]);
  });

  it('refuses without calling the model once the monthly cap is reached', async () => {
    let called = false;
    const usage = new FakeUsageRepository({ 'user_1::2026-06': 100000 });
    const useCase = new SendChatMessageUseCase({
      model: fakeModel(() => {
        called = true;
      }),
      usage,
      monthlyTokenCap: 100000,
    });

    await expect(
      useCase.execute({ userId: 'user_1', month: '2026-06', text: 'Salut', history: [] }),
    ).rejects.toBeInstanceOf(MonthlyTokenLimitError);

    expect(called).toBe(false);
    expect(usage.added).toHaveLength(0);
  });
});
