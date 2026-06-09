import type { ActivityDTO } from './ActivityDTO';

/**
 * One activity the chat assistant surfaces as a card. The `activity` is
 * *ephemeral* — synthesized from a web result, never persisted — so its
 * id/slug/coords are placeholders (see tbd.md). `reason` is the short, personal
 * "pourquoi ça pourrait te plaire" line shown under the card; `sourceUrl` links
 * back to the page the suggestion came from.
 */
export type ChatRecommendationDTO = {
  activity: ActivityDTO;
  reason: string;
  sourceUrl: string | null;
};
