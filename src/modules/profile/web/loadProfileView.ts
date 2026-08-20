import { getCurrentUser } from '../../../shared/auth/current-user';
import {
  PROFILE_AFFINITY_CATEGORIES,
  type ProfileAffinityCategory,
} from '../../../shared/contracts/ProfileFormDTO';
import type { ProfileViewDTO } from '../../../shared/contracts/ProfileViewDTO';
import { prisma } from '../../../shared/db/prisma';
import { avatarUrl } from '../../../shared/ui/avatarUrl';
import { GetProfileViewUseCase } from '../application/GetProfileViewUseCase';
import { PrismaProfileRepository } from '../infra/PrismaProfileRepository';
import type { ProfileFormInitial } from './ProfileFormModal';

const DEFAULT_AFFINITY = 5;

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
      // Random generated avatar, never the Google photo.
      avatarUrl: avatarUrl(user.id),
      tags: view.profile.tags,
    },
    stats: view.stats,
    breakdown: view.breakdown,
    history: view.history,
    counts: view.counts,
  };
}

/** Raw form values for pre-filling the edit modal (not carried by the view DTO). */
export async function loadProfileFormInitial(): Promise<ProfileFormInitial> {
  const current = await getCurrentUser();
  const [user, affinityRows] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: current.id },
      select: { gender: true, birthDate: true, cityId: true, bio: true, city: { select: { name: true } } },
    }),
    prisma.userCategoryAffinity.findMany({
      where: { userId: current.id },
      select: { category: true, score: true },
    }),
  ]);

  const affinities = Object.fromEntries(
    PROFILE_AFFINITY_CATEGORIES.map((category) => [
      category,
      affinityRows.find((a) => a.category === category)?.score ?? DEFAULT_AFFINITY,
    ]),
  ) as Record<ProfileAffinityCategory, number>;

  return {
    birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : '',
    gender: user.gender ?? '',
    cityId: user.cityId,
    cityName: user.city.name,
    bio: user.bio ?? '',
    affinities,
  };
}
