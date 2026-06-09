/**
 * The long-term memory the recommendation graph reflects on before searching:
 * the user's own words (bio) plus compact, already-formatted summaries of their
 * tastes and recent behaviour. All strings/lists so prompts can drop them in
 * verbatim — the DB shapes live in infra.
 */
export type UserRecommendationContext = {
  bio: string | null;
  /** Category labels ordered by affinity, strongest first. */
  topCategories: string[];
  /** Recent favorite activity titles. */
  recentFavorites: string[];
  /** Recent calendar activity titles. */
  recentHistory: string[];
};
