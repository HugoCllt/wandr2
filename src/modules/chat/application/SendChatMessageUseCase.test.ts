import { AIMessageChunk, SystemMessage } from '@langchain/core/messages';
import { FakeStreamingChatModel } from '@langchain/core/utils/testing';
import { describe, expect, it } from 'vitest';

import type { ChatStreamEvent } from '../../../shared/contracts/ChatStreamEvent';
import type { IChatUsageRepository } from '../domain/IChatUsageRepository';
import { MonthlyTokenLimitError } from '../domain/MonthlyTokenLimitError';
import type { TokenUsage } from '../domain/TokenUsage';
import { CHAT_SYSTEM_PROMPT } from './chatSystemPrompt';
import { buildChatMessages, SendChatMessageUseCase } from './SendChatMessageUseCase';

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

/** A model that streams the given content as separate token chunks. */
function streamingModel(...parts: string[]): FakeStreamingChatModel {
  return new FakeStreamingChatModel({
    chunks: parts.map((content) => new AIMessageChunk({ content })),
  });
}

async function collect(events: AsyncGenerator<ChatStreamEvent>): Promise<ChatStreamEvent[]> {
  const out: ChatStreamEvent[] = [];
  for await (const e of events) out.push(e);
  return out;
}

describe('buildChatMessages', () => {
  it('heads the conversation with the system prompt, then history, then the new turn', () => {
    const messages = buildChatMessages(
      [
        { role: 'user', content: 'Salut' },
        { role: 'assistant', content: 'Bonjour ! Que cherches-tu ?' },
      ],
      'Idée romantique ce soir',
    );

    expect(messages[0]).toBeInstanceOf(SystemMessage);
    expect(String(messages[0].content)).toBe(CHAT_SYSTEM_PROMPT);
    expect(messages).toHaveLength(4);
    expect(String(messages[messages.length - 1].content)).toBe('Idée romantique ce soir');
  });
});

describe('SendChatMessageUseCase.executeStream', () => {
  it('streams thinking → writing → tokens → done and records usage', async () => {
    const usage = new FakeUsageRepository();
    const useCase = new SendChatMessageUseCase({
      model: streamingModel('Quel ', 'quartier ', 'te tente ?'),
      usage,
      monthlyTokenCap: 100000,
    });

    const events = await collect(
      useCase.executeStream({ userId: 'user_1', month: '2026-06', text: 'Salut', history: [] }),
    );

    expect(events[0]).toEqual({ type: 'status', phase: 'thinking' });
    expect(events).toContainEqual({ type: 'status', phase: 'writing' });
    expect(events.at(-1)).toEqual({ type: 'done' });

    const answer = events
      .filter((e): e is { type: 'token'; text: string } => e.type === 'token')
      .map((e) => e.text)
      .join('');
    expect(answer).toBe('Quel quartier te tente ?');

    // Usage is always recorded (zeros here — the fake reports no usage_metadata).
    expect(usage.added).toHaveLength(1);
    expect(usage.added[0]).toMatchObject({ userId: 'user_1', month: '2026-06' });
  });

  it('refuses without streaming once the monthly cap is reached', async () => {
    const usage = new FakeUsageRepository({ 'user_1::2026-06': 100000 });
    const useCase = new SendChatMessageUseCase({
      model: streamingModel('ignored'),
      usage,
      monthlyTokenCap: 100000,
    });

    const iterator = useCase
      .executeStream({ userId: 'user_1', month: '2026-06', text: 'Salut', history: [] })
      [Symbol.asyncIterator]();

    await expect(iterator.next()).rejects.toBeInstanceOf(MonthlyTokenLimitError);
    expect(usage.added).toHaveLength(0);
  });
});
