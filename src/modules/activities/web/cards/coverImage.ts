import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';

// Shown when an activity has no image (imageUrl is null). Some ingested
// activities legitimately lack a photo; the cover area still needs a value.
// Kept in its own module (no React/provider deps) so the modal can use it
// without pulling in the ActivityProvider → ActivityModal cycle.
const PLACEHOLDER_IMAGE_URL = '/placeholder-activity.svg';

export function coverImageUrl(activity: ActivityDTO): string {
  return activity.imageUrl ?? PLACEHOLDER_IMAGE_URL;
}
