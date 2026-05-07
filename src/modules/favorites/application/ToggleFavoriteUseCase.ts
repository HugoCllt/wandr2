import type { IFavoriteRepository, ToggleFavoriteResult } from '../domain/IFavoriteRepository';

export class ToggleFavoriteUseCase {
  constructor(private readonly favorites: IFavoriteRepository) {}

  async execute(userId: string, activityId: string): Promise<ToggleFavoriteResult> {
    return this.favorites.toggle(userId, activityId);
  }
}
