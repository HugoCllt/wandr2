import type { ActivityCategory } from '../../activities/domain/ActivityCategorySet';

/**
 * One distinct angle the recommendation graph researches. Three axes are planned
 * per recommend turn — each yields one card. `query` is the web-search string;
 * `category` ties the resulting (synthetic) activity to a Wandr category so the
 * classic cards can render it.
 */
export type SearchAxis = {
  label: string;
  rationale: string;
  query: string;
  category: ActivityCategory;
};
