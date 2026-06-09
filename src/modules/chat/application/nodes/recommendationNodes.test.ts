import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { describe, expect, it } from 'vitest';

import type { SearchAxis } from '../../domain/SearchAxis';
import type { UserRecommendationContext } from '../../domain/UserRecommendationContext';
import type { WebSearchResult } from '../../domain/WebSearchResult';
import type { ChatStateType } from '../chatState';
import { makeRouterNode } from './router';
import { makeStrategyNode } from './strategy';
import { makeSynthesizeNode } from './synthesize';

/** Minimal config — the nodes only ever touch the optional `writer`. */
const config = {} as LangGraphRunnableConfig;

function stateOf(partial: Partial<ChatStateType>): ChatStateType {
  return {
    messages: [new SystemMessage('sys'), new HumanMessage('un truc culturel ce weekend')],
    userId: 'u1',
    cityId: 'c1',
    route: 'clarify',
    userContext: null,
    axes: [],
    searchResults: [],
    recommendations: [],
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    ...partial,
  } as ChatStateType;
}

const EMPTY_CTX: UserRecommendationContext = {
  bio: null,
  topCategories: [],
  recentFavorites: [],
  recentHistory: [],
};

describe('router node', () => {
  it('returns the parsed action on valid JSON', async () => {
    const node = makeRouterNode(new FakeListChatModel({ responses: ['{"action":"recommend"}'] }));
    expect((await node(stateOf({}))).route).toBe('recommend');
  });

  it('falls back to clarify when the structured call never parses', async () => {
    const node = makeRouterNode(new FakeListChatModel({ responses: ['nope', 'still nope'] }));
    expect((await node(stateOf({}))).route).toBe('clarify');
  });
});

describe('strategy node', () => {
  it('parses three axes', async () => {
    const json = JSON.stringify({
      axes: [
        { label: 'A', rationale: 'r', query: 'q1', category: 'CULTURE' },
        { label: 'B', rationale: 'r', query: 'q2', category: 'FOOD' },
        { label: 'C', rationale: 'r', query: 'q3', category: 'OUTDOOR' },
      ],
    });
    const node = makeStrategyNode(new FakeListChatModel({ responses: [json] }));

    const result = await node(stateOf({ userContext: EMPTY_CTX }), config);
    expect(result.axes).toHaveLength(3);
    expect(result.axes?.map((a) => a.category)).toEqual(['CULTURE', 'FOOD', 'OUTDOOR']);
  });

  it('falls back to axes from top categories when JSON is unparseable', async () => {
    const node = makeStrategyNode(new FakeListChatModel({ responses: ['broken', 'broken'] }));
    const ctx: UserRecommendationContext = { ...EMPTY_CTX, topCategories: ['SPORT'] };

    const result = await node(stateOf({ userContext: ctx }), config);
    expect(result.axes).toHaveLength(1);
    expect(result.axes?.[0].category).toBe('SPORT');
  });
});

describe('synthesize node', () => {
  const axes: SearchAxis[] = [
    { label: 'Culture', rationale: 'r', query: 'q0', category: 'CULTURE' },
    { label: 'Food', rationale: 'r', query: 'q1', category: 'FOOD' },
    { label: 'Outdoor', rationale: 'r', query: 'q2', category: 'OUTDOOR' },
  ];
  const hit: WebSearchResult = {
    title: 'A',
    url: 'https://a.test',
    content: 'c',
    imageUrl: 'https://a.test/img.jpg',
  };
  const searchResults: WebSearchResult[][] = [[hit], [hit], []];

  it('maps valid cards to one recommendation per axis, in order', async () => {
    const json = JSON.stringify({
      cards: [
        { axisIndex: 1, title: 'Resto', description: 'd', reason: 'r', sourceUrl: hit.url },
        { axisIndex: 0, title: 'Musée', description: 'd', reason: 'r', sourceUrl: hit.url },
      ],
    });
    const node = makeSynthesizeNode(new FakeListChatModel({ responses: [json] }));

    const result = await node(stateOf({ axes, searchResults }), config);
    expect(result.recommendations).toHaveLength(2);
    // Sorted by axis order: axis 0 (CULTURE) before axis 1 (FOOD).
    expect(result.recommendations?.[0].activity.categories.primary).toBe('CULTURE');
    expect(result.recommendations?.[0].activity.imageUrl).toBe(hit.imageUrl);
    expect(result.recommendations?.[1].activity.categories.primary).toBe('FOOD');
  });

  it('drops cards pointing at a non-existent axis', async () => {
    const json = JSON.stringify({
      cards: [{ axisIndex: 9, title: 'X', description: 'd', reason: 'r', sourceUrl: hit.url }],
    });
    const node = makeSynthesizeNode(new FakeListChatModel({ responses: [json] }));

    const result = await node(stateOf({ axes, searchResults }), config);
    expect(result.recommendations).toHaveLength(0);
  });

  it('yields zero cards when the structured call never parses', async () => {
    const node = makeSynthesizeNode(new FakeListChatModel({ responses: ['nope', 'nope'] }));
    const result = await node(stateOf({ axes, searchResults }), config);
    expect(result.recommendations).toHaveLength(0);
  });
});
