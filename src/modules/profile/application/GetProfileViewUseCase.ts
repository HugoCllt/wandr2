import type { IProfileRepository, ProfileView } from '../domain/IProfileRepository';

export class GetProfileViewUseCase {
  constructor(private readonly profiles: IProfileRepository) {}

  async execute(userId: string): Promise<ProfileView> {
    return this.profiles.getProfileView(userId);
  }
}
