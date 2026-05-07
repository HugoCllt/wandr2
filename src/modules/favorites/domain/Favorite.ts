export type Favorite = {
  id: string;
  userId: string;
  activityId: string;
  createdAt: Date;
};

export type FavoriteCreateInput = Omit<Favorite, 'id' | 'createdAt'>;

export function createFavorite(input: FavoriteCreateInput): FavoriteCreateInput {
  if (input.userId.trim().length === 0) {
    throw new Error('Favorite userId is required.');
  }
  if (input.activityId.trim().length === 0) {
    throw new Error('Favorite activityId is required.');
  }
  return input;
}
