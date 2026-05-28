import type { PrismaClient } from '@prisma/client';

import type { IProfileRepository, ProfileView } from '../domain/IProfileRepository';
import type {
  IProfileWriteRepository,
  ProfileUpdateInput,
} from '../domain/IProfileWriteRepository';

const CATEGORY_META: Record<string, { label: string; iconKey: string; cool: boolean }> = {
  SPORT: { label: 'Sport', iconKey: 'ball', cool: false },
  ROMANTIC: { label: 'Romantic', iconKey: 'heart', cool: false },
  FOOD: { label: 'Dining', iconKey: 'fork', cool: true },
  CULTURE: { label: 'Culture', iconKey: 'culture', cool: true },
  OUTDOOR: { label: 'Outdoor', iconKey: 'mountain', cool: false },
  NIGHTLIFE: { label: 'Nightlife', iconKey: 'sparkle', cool: true },
};
const CATEGORY_ORDER = ['SPORT', 'ROMANTIC', 'FOOD', 'CULTURE', 'OUTDOOR', 'NIGHTLIFE'];
const TAG_KINDS: ('warm' | 'cool' | '')[] = ['warm', 'cool', ''];

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' });

function metaFor(category: string) {
  return CATEGORY_META[category] ?? { label: category, iconKey: 'sparkle', cool: false };
}

export class PrismaProfileRepository implements IProfileRepository, IProfileWriteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getOnboardedAt(userId: string): Promise<Date | null> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { onboardedAt: true },
    });
    return user.onboardedAt;
  }

  async saveProfile(
    userId: string,
    input: ProfileUpdateInput,
    opts: { markOnboarded: boolean },
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          gender: input.gender,
          birthDate: input.birthDate,
          cityId: input.cityId,
          bio: input.bio,
          ...(opts.markOnboarded ? { onboardedAt: new Date() } : {}),
        },
      });
      for (const affinity of input.affinities) {
        await tx.userCategoryAffinity.upsert({
          where: { userId_category: { userId, category: affinity.category } },
          update: { score: affinity.score },
          create: { userId, category: affinity.category, score: affinity.score },
        });
      }
    });
  }

  async getProfileView(userId: string): Promise<ProfileView> {
    const [user, affinities, favoritesCount, calendarCount, recent] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { id: true, name: true, bio: true, image: true },
      }),
      this.prisma.userCategoryAffinity.findMany({
        where: { userId },
        select: { category: true, score: true },
      }),
      this.prisma.favorite.count({ where: { userId } }),
      this.prisma.calendarEntry.count({ where: { userId } }),
      this.prisma.calendarEntry.findMany({
        where: { userId },
        orderBy: { scheduledAt: 'desc' },
        take: 4,
        select: {
          id: true,
          scheduledAt: true,
          activity: { select: { title: true, neighborhood: true, address: true, imageUrl: true } },
        },
      }),
    ]);

    const byScore = [...affinities].sort((a, b) => b.score - a.score);
    const top = byScore[0];

    const tags = byScore.slice(0, 3).map((a, i) => ({
      label: metaFor(a.category).label,
      kind: TAG_KINDS[i],
    }));

    const breakdown = CATEGORY_ORDER.map((category) => {
      const score = affinities.find((a) => a.category === category)?.score ?? 0;
      const meta = metaFor(category);
      return { name: meta.label, iconKey: meta.iconKey, percent: score * 10, cool: meta.cool };
    });

    const now = Date.now();
    const history = recent.map((e) => ({
      id: e.id,
      title: e.activity.title,
      meta: e.activity.neighborhood ?? e.activity.address,
      date: dateFmt.format(e.scheduledAt),
      status: (e.scheduledAt.getTime() > now ? 'upcoming' : 'went') as 'upcoming' | 'went',
      imageUrl: e.activity.imageUrl ?? '/placeholder-activity.svg',
    }));

    return {
      profile: {
        id: user.id,
        name: user.name,
        vibe: user.bio ? `"${user.bio}"` : '',
        avatarUrl: user.image,
        tags,
      },
      stats: [
        { label: 'Activities', value: String(calendarCount), foot: 'On your calendar', footKind: '' },
        { label: 'Saved', value: String(favoritesCount), foot: 'In your favorites', footKind: '' },
        {
          label: 'Top Category',
          value: top ? metaFor(top.category).label : '—',
          foot: top ? `${top.score * 10}% affinity` : 'Set your interests',
          footKind: 'warm',
        },
      ],
      breakdown,
      history,
    };
  }
}
