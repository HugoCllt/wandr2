export type ToggleFavoriteResult = {
  isFavorited: boolean;
};

export interface IFavoriteRepository {
  toggle(userId: string, activityId: string): Promise<ToggleFavoriteResult>;
  isFavorited(userId: string, activityId: string): Promise<boolean>;
  listActivityIdsForUser(userId: string): Promise<string[]>;
}
