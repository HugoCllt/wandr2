import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { z } from 'zod';

import type { City } from '../../../activities/domain/City';
import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import type { ChatRecommendationDTO } from '../../../../shared/contracts/ChatRecommendationDTO';
import type { SearchAxis } from '../../domain/SearchAxis';
import type { WebSearchResult } from '../../domain/WebSearchResult';
import type { ChatCustomEvent, ChatStateType } from '../chatState';
import { synthesisPrompt } from '../prompts';
import { structuredCall } from '../structuredCall';

const SynthesisSchema = z.object({
  cards: z
    .array(
      z.object({
        axisIndex: z.number().int().min(0),
        title: z.string().min(1),
        description: z.string().min(1),
        reason: z.string().min(1),
        sourceUrl: z.string().optional().default(''),
      }),
    )
    .default([]),
});

type SynthesisCard = z.infer<typeof SynthesisSchema>['cards'][number];

/**
 * Compresses the three axes' web results into 0–3 cards in one structured call
 * (POC choice — ~3× faster locally than one call per axis). Keeps the valid
 * entries on partial parse; on a hard failure emits zero cards so `present` can
 * be honest. The activities are synthetic (ephemeral, never persisted).
 */
export function makeSynthesizeNode(model: BaseChatModel) {
  return async (
    state: ChatStateType,
    config: LangGraphRunnableConfig,
  ): Promise<Partial<ChatStateType>> => {
    config.writer?.({ kind: 'phase', phase: 'synthesizing' } satisfies ChatCustomEvent);

    const { axes, searchResults, city } = state;
    const { system, user } = synthesisPrompt(axes, searchResults, city.name);
    try {
      const { value, usage } = await structuredCall(
        model,
        [new SystemMessage(system), new HumanMessage(user)],
        SynthesisSchema,
      );
      return {
        recommendations: toRecommendations(value.cards, axes, searchResults, city),
        usage,
      };
    } catch {
      return { recommendations: [] };
    }
  };
}

/** One card per axis, in axis order — drops invalid indices, duplicate axes,
 * and cross-axis duplicates (two axes surfacing the same place — same title;
 * URL is no signal: one listicle page can legitimately source two cards). */
function toRecommendations(
  cards: SynthesisCard[],
  axes: SearchAxis[],
  searchResults: WebSearchResult[][],
  city: City,
): ChatRecommendationDTO[] {
  const seen = new Set<number>();
  const seenPlaces = new Set<string>();
  const recos: { axisIndex: number; reco: ChatRecommendationDTO }[] = [];

  for (const card of cards) {
    const axis = axes[card.axisIndex];
    if (!axis || seen.has(card.axisIndex)) continue;

    const hits = searchResults[card.axisIndex] ?? [];
    const source = hits.find((r) => r.url === card.sourceUrl) ?? hits[0] ?? null;

    const titleKey = slugify(card.title);
    if (seenPlaces.has(titleKey)) continue;
    seen.add(card.axisIndex);
    seenPlaces.add(titleKey);
    recos.push({
      axisIndex: card.axisIndex,
      reco: {
        activity: syntheticActivity(card, axis, source, city),
        axisLabel: axis.label,
        reason: card.reason,
        sourceUrl: card.sourceUrl || source?.url || null,
      },
    });
  }

  return recos.sort((a, b) => a.axisIndex - b.axisIndex).map((r) => r.reco);
}

function syntheticActivity(
  card: SynthesisCard,
  axis: SearchAxis,
  source: WebSearchResult | null,
  city: City,
): ActivityDTO {
  const now = new Date().toISOString();
  return {
    id: `chat-reco-${card.axisIndex}`,
    slug: slugify(card.title),
    title: card.title,
    description: card.description,
    imageUrl: source?.imageUrl ?? null,
    kind: 'PLACE',
    categories: { primary: axis.category, secondary: [] },
    address: city.name,
    neighborhood: null,
    latitude: city.centerLat,
    longitude: city.centerLng,
    dateStart: null,
    dateEnd: null,
    priceMinCents: 0,
    priceMaxCents: null,
    externalUrl: card.sourceUrl || source?.url || null,
    indoor: false,
    outdoor: false,
    isFeatured: false,
    status: 'PUBLISHED',
    createdAt: now,
    updatedAt: now,
  };
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'activite'
  );
}
