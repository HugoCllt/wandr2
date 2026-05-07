import { notFound } from 'next/navigation';

import { ActivityNotFoundError } from '../../../modules/activities/domain/ActivityNotFoundError';
import { loadActivityWithFavoriteBySlug } from '../../../modules/activities/web/activityDetailRoute';
import { ActivityDetail } from '../../../shared/ui/ActivityDetail';

export const dynamic = 'force-dynamic';

export default async function ActivityPage({ params }: { params: { slug: string } }) {
  try {
    const { activity, isFavorited } = await loadActivityWithFavoriteBySlug(params.slug);
    return <ActivityDetail activity={activity} isFavorited={isFavorited} />;
  } catch (error) {
    if (error instanceof ActivityNotFoundError) {
      notFound();
    }
    throw error;
  }
}
