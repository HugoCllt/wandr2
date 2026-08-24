import { ActivityCategories, type ActivityCategory, type ActivityCategorySet } from '@wandr/shared';

export { ActivityCategories, type ActivityCategory, type ActivityCategorySet } from '@wandr/shared';

export function validateCategorySet(set: ActivityCategorySet): void {
  if (!ActivityCategories.includes(set.primary)) {
    throw new Error('Activity category set primary is invalid.');
  }

  if (!Array.isArray(set.secondary)) {
    throw new Error('Activity category set secondary must be an array.');
  }

  if (set.secondary.length > 2) {
    throw new Error('Activity category set may have at most 2 secondary categories.');
  }

  for (const c of set.secondary) {
    if (!ActivityCategories.includes(c)) {
      throw new Error('Activity category set secondary contains an invalid category.');
    }
  }

  if (new Set(set.secondary).size !== set.secondary.length) {
    throw new Error('Activity category set secondary entries must be distinct.');
  }

  if (set.secondary.includes(set.primary)) {
    throw new Error('Activity category set primary must not appear in secondary.');
  }
}

export function categorySetToArray(set: ActivityCategorySet): ActivityCategory[] {
  return [set.primary, ...set.secondary];
}
