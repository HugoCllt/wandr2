export const ActivityCategories = [
  'SPORT',
  'ROMANTIC',
  'FOOD',
  'CULTURE',
  'OUTDOOR',
  'NIGHTLIFE',
] as const;
export type ActivityCategory = (typeof ActivityCategories)[number];

export type ActivityCategorySet = {
  primary: ActivityCategory;
  secondary: ActivityCategory[];
};
