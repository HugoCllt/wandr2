import { createActivity, type Activity, type ActivityCreateInput } from '../domain/Activity';
import type { IActivityRepository } from '../domain/IActivityRepository';

export type CreateActivityUseCaseInput = Omit<ActivityCreateInput, 'slug' | 'sourceId'> & {
  slug?: string;
  sourceName?: string;
};

export class CreateActivityUseCase {
  constructor(private readonly activities: IActivityRepository) {}

  async execute(input: CreateActivityUseCaseInput): Promise<Activity> {
    const sourceId = await this.activities.getOrCreateSourceIdByName(input.sourceName ?? 'manual');
    const slug = await this.createUniqueSlug(input.slug ?? input.title);

    return this.activities.create(
      createActivity({
        ...input,
        slug,
        sourceId,
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

function slugify(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug.length > 0 ? slug : 'activity';
}
