import { createActivity, type Activity, type ActivityCreateInput } from '../domain/Activity';
import { computeDedupeKey } from '../domain/computeDedupeKey';
import { computeExpiresAt, computeRecheckAfter } from '../domain/freshness';
import type { IActivityRepository } from '../domain/IActivityRepository';
import { slugify } from '../domain/slug';

export type CreateActivityUseCaseInput = Omit<
  ActivityCreateInput,
  'slug' | 'sourceId' | 'dedupeKey' | 'expiresAt' | 'lastSeenAt' | 'lastVerifiedAt' | 'recheckAfter'
> & {
  slug?: string;
  sourceName?: string;
  now?: Date;
};

export class CreateActivityUseCase {
  constructor(private readonly activities: IActivityRepository) {}

  async execute(input: CreateActivityUseCaseInput): Promise<Activity> {
    const now = input.now ?? new Date();
    const sourceId = await this.activities.getOrCreateSourceIdByName(input.sourceName ?? 'manual');
    const slug = await this.createUniqueSlug(input.slug ?? input.title);

    const dedupeKey = computeDedupeKey({
      kind: input.kind,
      title: input.title,
      dateStart: input.dateStart,
      latitude: input.latitude,
      longitude: input.longitude,
    });

    return this.activities.create(
      createActivity({
        ...input,
        slug,
        sourceId,
        dedupeKey,
        expiresAt: computeExpiresAt({ kind: input.kind, dateEnd: input.dateEnd }),
        lastSeenAt: now,
        lastVerifiedAt: now,
        recheckAfter: computeRecheckAfter({ kind: input.kind, lastSeenAt: now }),
      }),
    );
  }

  private async createUniqueSlug(value: string): Promise<string> {
    const baseSlug = slugify(value);
    let candidate = baseSlug;
    let suffix = 2;

    while (await this.activities.slugExists(candidate)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }
}
