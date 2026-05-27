import type { Activity } from '../../modules/activities/domain/Activity';
import type { ActivityDTO } from './ActivityDTO';

export function toActivityDTO(activity: Activity): ActivityDTO {
  return {
    id: activity.id,
    slug: activity.slug,
    title: activity.title,
    description: activity.description,
    imageUrl: activity.imageUrl,
    kind: activity.kind,
    categories: activity.categories,
    address: activity.address,
    neighborhood: activity.neighborhood,
    latitude: activity.latitude,
    longitude: activity.longitude,
    dateStart: activity.dateStart?.toISOString() ?? null,
    dateEnd: activity.dateEnd?.toISOString() ?? null,
    priceMinCents: activity.priceMinCents,
    priceMaxCents: activity.priceMaxCents,
    externalUrl: activity.externalUrl,
    indoor: activity.indoor,
    outdoor: activity.outdoor,
    isFeatured: activity.isFeatured,
    status: activity.status,
    createdAt: activity.createdAt.toISOString(),
    updatedAt: activity.updatedAt.toISOString(),
  };
}
