import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage } from '@langchain/core/messages';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { z } from 'zod';

import {
  type ActivityCategory,
  ActivityCategories,
} from '../../../activities/domain/ActivityCategorySet';
import type { SearchAxis } from '../../domain/SearchAxis';
import type { UserRecommendationContext } from '../../domain/UserRecommendationContext';
import type { ChatCustomEvent, ChatStateType } from '../chatState';
import { conversationOnly } from './helpers';
import { strategyPrompt } from '../prompts';
import { structuredCall } from '../structuredCall';

const StrategySchema = z.object({
  axes: z
    .array(
      z.object({
        label: z.string().min(1),
        rationale: z.string().min(1),
        query: z.string().min(1),
        category: z.enum(ActivityCategories),
      }),
    )
    .min(1),
});

/** French web-search seed for a category, used by the fallback axes. */
const CATEGORY_QUERY: Record<ActivityCategory, string> = {
  SPORT: 'activité sportive',
  ROMANTIC: 'sortie romantique',
  FOOD: 'bon restaurant',
  CULTURE: 'activité culturelle',
  OUTDOOR: 'activité de plein air',
  NIGHTLIFE: 'sortie de soirée',
};

/**
 * Plans three distinct research axes from the conversation + profile. On a
 * structured-call failure it falls back to axes seeded from the user's top
 * categories (or Culture when the profile is empty).
 */
export function makeStrategyNode(model: BaseChatModel) {
  return async (
    state: ChatStateType,
    config: LangGraphRunnableConfig,
  ): Promise<Partial<ChatStateType>> => {
    config.writer?.({ kind: 'phase', phase: 'reflecting' } satisfies ChatCustomEvent);

    const ctx = state.userContext ?? emptyContext();
    const messages = [
      new SystemMessage(strategyPrompt(ctx, state.city.name)),
      ...conversationOnly(state.messages),
    ];
    try {
      const { value, usage } = await structuredCall(model, messages, StrategySchema);
      return { axes: value.axes.slice(0, 3), usage };
    } catch {
      return { axes: fallbackAxes(ctx, state.city.name) };
    }
  };
}

function fallbackAxes(ctx: UserRecommendationContext, cityName: string): SearchAxis[] {
  const cats = ctx.topCategories.filter(isCategory).slice(0, 3);
  const chosen: ActivityCategory[] = cats.length > 0 ? cats : ['CULTURE'];
  return chosen.map((category) => ({
    label: CATEGORY_QUERY[category],
    rationale: 'Basé sur tes catégories préférées.',
    query: `${CATEGORY_QUERY[category]} à ${cityName}`,
    category,
  }));
}

function isCategory(value: string): value is ActivityCategory {
  return (ActivityCategories as readonly string[]).includes(value);
}

function emptyContext(): UserRecommendationContext {
  return { bio: null, topCategories: [], recentFavorites: [], recentHistory: [] };
}
