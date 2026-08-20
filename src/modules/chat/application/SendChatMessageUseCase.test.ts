import { SystemMessage } from '@langchain/core/messages';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { describe, expect, it } from 'vitest';

import type { ChatStreamEvent } from '../../../shared/contracts/ChatStreamEvent';
import type { IChatUsageRepository } from '../domain/IChatUsageRepository';
import type { IRecommendationContextRepository } from '../domain/IRecommendationContextRepository';
import type { IWebSearchProvider } from '../domain/IWebSearchProvider';
import { MonthlyTokenLimitError } from '../domain/MonthlyTokenLimitError';
import type { TokenUsage } from '../domain/TokenUsage';
import type { UserRecommendationContext } from '../domain/UserRecommendationContext';
import type { WebSearchResult } from '../domain/WebSearchResult';
import type { City } from '../../activities/domain/City';
import { chatSystemPrompt } from './chatSystemPrompt';
import {
  buildChatMessages,
  SendChatMessageUseCase,
  type SendChatMessageDeps,
} from './SendChatMessageUseCase';

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

class FakeRecommendationContextRepository implements IRecommendationContextRepository {
  constructor(private readonly ctx: UserRecommendationContext) {}
  async load(): Promise<UserRecommendationContext> {
    return this.ctx;
  }
}

class FakeWebSearchProvider implements IWebSearchProvider {
  public readonly queries: string[] = [];
  constructor(private readonly results: WebSearchResult[]) {}
  async search(query: string): Promise<WebSearchResult[]> {
    this.queries.push(query);
    return this.results;
  }
}

const CONTEXT: UserRecommendationContext = {
  bio: 'Curieux, aime les musées.',
  topCategories: ['CULTURE', 'FOOD'],
  recentFavorites: ['MAC'],
  recentHistory: [],
};

const HIT: WebSearchResult = {
  title: 'Lieu A',
  url: 'https://example.com/a',
  content: 'Un endroit chouette à Montréal.',
  imageUrl: 'https://example.com/a.jpg',
};

function strategyJson(): string {
  return JSON.stringify({
    axes: [
      { label: 'Culture', rationale: 'r', query: 'musée Montréal', category: 'CULTURE' },
      { label: 'Resto', rationale: 'r', query: 'restaurant Montréal', category: 'FOOD' },
      { label: 'Plein air', rationale: 'r', query: 'parc Montréal', category: 'OUTDOOR' },
    ],
  });
}

function synthJson(): string {
  return JSON.stringify({
    cards: [0, 1, 2].map((axisIndex) => ({
      axisIndex,
      title: `Idée ${axisIndex}`,
      description: 'desc',
      reason: 'parce que ça te ressemble',
      sourceUrl: HIT.url,
    })),
  });
}

function deps(model: FakeListChatModel, usage: FakeUsageRepository): SendChatMessageDeps {
  return {
    model,
    usage,
    contextRepo: new FakeRecommendationContextRepository(CONTEXT),
    webSearch: new FakeWebSearchProvider([HIT]),
    monthlyTokenCap: 100000,
  };
}

async function collect(events: AsyncGenerator<ChatStreamEvent>): Promise<ChatStreamEvent[]> {
  const out: ChatStreamEvent[] = [];
  for await (const e of events) out.push(e);
  return out;
}

function statusPhases(events: ChatStreamEvent[]): string[] {
  return events.filter((e) => e.type === 'status').map((e) => (e as { phase: string }).phase);
}

function answerText(events: ChatStreamEvent[]): string {
  return events
    .filter((e): e is { type: 'token'; text: string } => e.type === 'token')
    .map((e) => e.text)
    .join('');
}

const city: City = {
  id: 'c1',
  slug: 'montreal',
  name: 'Montréal',
  country: 'CA',
  timezone: 'America/Toronto',
  centerLat: 45.5019,
  centerLng: -73.5674,
  bboxMinLat: 45.4,
  bboxMinLng: -73.98,
  bboxMaxLat: 45.71,
  bboxMaxLng: -73.47,
};

describe('buildChatMessages', () => {
  it('heads the conversation with the system prompt, then history, then the new turn', () => {
    const messages = buildChatMessages(
      [
        { role: 'user', content: 'Salut' },
        { role: 'assistant', content: 'Bonjour ! Que cherches-tu ?' },
      ],
      'Idée romantique ce soir',
      'Montréal',
    );

    expect(messages[0]).toBeInstanceOf(SystemMessage);
    expect(String(messages[0].content)).toBe(chatSystemPrompt('Montréal'));
    expect(messages).toHaveLength(4);
    expect(String(messages[messages.length - 1].content)).toBe('Idée romantique ce soir');
  });

  it('folds input-toggle context into the new turn when provided', () => {
    const messages = buildChatMessages(
      [],
      'Un bar sympa',
      'Montréal',
      'Contexte : je cherche quelque chose pour ce soir.',
    );

    expect(String(messages[messages.length - 1].content)).toBe(
      'Un bar sympa\n\nContexte : je cherche quelque chose pour ce soir.',
    );
  });
});

describe('SendChatMessageUseCase.executeStream', () => {
  it('clarify path: routes to converse and streams the reply, no cards', async () => {
    const usage = new FakeUsageRepository();
    const model = new FakeListChatModel({
      responses: ['{"action":"clarify"}', 'Quel quartier te tente ?'],
    });
    const useCase = new SendChatMessageUseCase(deps(model, usage));

    const events = await collect(
      useCase.executeStream({
        userId: 'u1',
        city,
        month: '2026-06',
        text: 'Je m’ennuie',
        history: [],
      }),
    );

    expect(events[0]).toEqual({ type: 'status', phase: 'thinking' });
    expect(statusPhases(events)).toContain('writing');
    expect(answerText(events)).toBe('Quel quartier te tente ?');
    expect(events.some((e) => e.type === 'recommendations')).toBe(false);
    expect(events.at(-1)).toEqual({ type: 'done' });
    expect(usage.added).toHaveLength(1);
  });

  it('recommend path: reflects, searches, synthesizes, then emits cards + intro', async () => {
    const usage = new FakeUsageRepository();
    const model = new FakeListChatModel({
      responses: [
        '{"action":"recommend"}',
        strategyJson(),
        synthJson(),
        'Voici quelques idées pour toi.',
      ],
    });
    const useCase = new SendChatMessageUseCase(deps(model, usage));

    const events = await collect(
      useCase.executeStream({
        userId: 'u1',
        city,
        month: '2026-06',
        text: 'Un truc culturel ce weekend',
        history: [],
      }),
    );

    const phasesSeen = statusPhases(events);
    expect(phasesSeen[0]).toBe('thinking');
    expect(phasesSeen).toEqual(expect.arrayContaining(['reflecting', 'searching', 'synthesizing']));

    const recoEvent = events.find((e) => e.type === 'recommendations');
    expect(recoEvent).toBeDefined();
    const items = (recoEvent as { items: unknown[] }).items;
    expect(items).toHaveLength(3);

    expect(answerText(events)).toBe('Voici quelques idées pour toi.');
    expect(events.at(-1)).toEqual({ type: 'done' });
    expect(usage.added).toHaveLength(1);
  });

  it('refuses without streaming once the monthly cap is reached', async () => {
    const usage = new FakeUsageRepository({ 'u1::2026-06': 100000 });
    const model = new FakeListChatModel({ responses: ['ignored'] });
    const useCase = new SendChatMessageUseCase(deps(model, usage));

    const iterator = useCase
      .executeStream({ userId: 'u1', city, month: '2026-06', text: 'Salut', history: [] })
      [Symbol.asyncIterator]();

    await expect(iterator.next()).rejects.toBeInstanceOf(MonthlyTokenLimitError);
    expect(usage.added).toHaveLength(0);
  });
});
