import type { ActivityDTO } from './ActivityDTO';

/**
 * One activity the chat assistant surfaces as a card. The `activity` is
 * *ephemeral* — synthesized from a web result, never persisted — so its
 * id/slug/coords are placeholders (see tbd.md). `axisLabel` is the research
 * angle's short French title, shown as the section eyebrow; `reason` is the
 * personal "pourquoi ça pourrait te plaire" paragraph beside the card;
 * `sourceUrl` links back to the page the suggestion came from.
 */
export type ChatRecommendationDTO = {
  activity: ActivityDTO;
  axisLabel: string;
  reason: string;
  sourceUrl: string | null;
};
