import { notFound } from 'next/navigation';

import { ActivityNotFoundError } from '../../../modules/activities/domain/ActivityNotFoundError';
import { loadActivityDTOBySlug } from '../../../modules/activities/web/activityDetailRoute';
import { ActivityDetail } from '../../../shared/ui/ActivityDetail';

export const dynamic = 'force-dynamic';

export default async function ActivityPage({ params }: { params: { slug: string } }) {
  try {
    const activity = await loadActivityDTOBySlug(params.slug);
    return <ActivityDetail activity={activity} />;
  } catch (error) {
    if (error instanceof ActivityNotFoundError) {
      notFound();
    }
    throw error;
  }
}
