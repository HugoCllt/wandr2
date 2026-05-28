import { getCurrentUser } from '../../../shared/auth/current-user';
import type { ProfileViewDTO } from '../../../shared/contracts/ProfileViewDTO';
import { prisma } from '../../../shared/db/prisma';
import { GetProfileViewUseCase } from '../application/GetProfileViewUseCase';
import { PrismaProfileRepository } from '../infra/PrismaProfileRepository';

export async function loadProfileView(): Promise<ProfileViewDTO> {
  const user = await getCurrentUser();
  const view = await new GetProfileViewUseCase(
    new PrismaProfileRepository(prisma),
  ).execute(user.id);
  return {
    profile: {
      id: view.profile.id,
      name: view.profile.name,
      vibe: view.profile.vibe,
      avatarUrl: view.profile.avatarUrl,
      tags: view.profile.tags,
    },
    stats: view.stats,
    breakdown: view.breakdown,
    history: view.history,
  };
}
