export const ActivityKinds = ['EVENT', 'PLACE'] as const;
export type ActivityKind = (typeof ActivityKinds)[number];

export const ActivityCategories = [
  'SPORT',
  'ROMANTIC',
  'FOOD',
  'CULTURE',
  'OUTDOOR',
  'NIGHTLIFE',
] as const;
export type ActivityCategory = (typeof ActivityCategories)[number];

export const ActivityStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type ActivityStatus = (typeof ActivityStatuses)[number];

export type Activity = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  imageCredit: string | null;
  kind: ActivityKind;
  category: ActivityCategory;
  address: string;
  neighborhood: string | null;
  latitude: number;
  longitude: number;
  dateStart: Date | null;
  dateEnd: Date | null;
  priceMinCents: number;
  priceMaxCents: number | null;
  externalUrl: string | null;
  indoor: boolean;
  outdoor: boolean;
  isFeatured: boolean;
  status: ActivityStatus;
  sourceId: string;
  externalId: string | null;
  cityId: string;
  tags: string[];
  dedupeKey: string;
  expiresAt: Date | null;
  lastSeenAt: Date;
  lastVerifiedAt: Date | null;
  recheckAfter: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ActivityCreateInput = Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>;

const SLUG_PATTERN = /^[a-z0-9-]+$/;

export function createActivity(input: ActivityCreateInput): ActivityCreateInput {
  validateActivity(input);
  return input;
}

export function validateActivity(input: ActivityCreateInput | Activity): void {
  assertNonEmpty(input.slug, 'slug');
  assertNonEmpty(input.title, 'title');
  assertNonEmpty(input.description, 'description');
  assertNonEmpty(input.imageUrl, 'imageUrl');
  assertNonEmpty(input.address, 'address');
  assertNonEmpty(input.cityId, 'cityId');
  assertNonEmpty(input.dedupeKey, 'dedupeKey');

  if (!SLUG_PATTERN.test(input.slug)) {
    throw new Error('Activity slug must contain only lowercase letters, numbers, and hyphens.');
  }

  if (!ActivityKinds.includes(input.kind)) {
    throw new Error('Activity kind is invalid.');
  }

  if (!ActivityCategories.includes(input.category)) {
    throw new Error('Activity category is invalid.');
  }

  if (!ActivityStatuses.includes(input.status)) {
    throw new Error('Activity status is invalid.');
  }

  if (input.kind === 'EVENT') {
    if (!input.dateStart || !input.dateEnd) {
      throw new Error('EVENT activities require dateStart and dateEnd.');
    }

    if (input.dateEnd < input.dateStart) {
      throw new Error('EVENT dateEnd must be greater than or equal to dateStart.');
    }
  }

  if (input.kind === 'PLACE' && (input.dateStart || input.dateEnd)) {
    throw new Error('PLACE activities must not have dateStart or dateEnd.');
  }

  if (!Number.isInteger(input.priceMinCents) || input.priceMinCents < 0) {
    throw new Error('priceMinCents must be a non-negative integer.');
  }

  if (
    input.priceMaxCents !== null &&
    (!Number.isInteger(input.priceMaxCents) || input.priceMaxCents < input.priceMinCents)
  ) {
    throw new Error('priceMaxCents must be greater than or equal to priceMinCents.');
  }

  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
    throw new Error('Activity coordinates must be finite numbers.');
  }

  if (input.kind === 'PLACE' && input.expiresAt !== null) {
    throw new Error('PLACE activities must not have expiresAt.');
  }

  if (input.kind === 'EVENT') {
    if (input.expiresAt === null) {
      throw new Error('EVENT activities require expiresAt.');
    }
    if (input.dateEnd && input.expiresAt.getTime() !== input.dateEnd.getTime()) {
      throw new Error('EVENT expiresAt must equal dateEnd.');
    }
  }
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`Activity ${field} is required.`);
  }
}
