import type { ActivityCategory } from '../../activities/domain/Activity';
import type { IAffinityRepository } from '../domain/IAffinityRepository';

export class GetUserAffinityMapUseCase {
  constructor(private readonly affinities: IAffinityRepository) {}

  async execute(userId: string): Promise<Map<ActivityCategory, number>> {
    return this.affinities.getScoreMap(userId);
  }
}
