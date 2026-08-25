import { NextResponse } from 'next/server';

import { loadActivityDTOBySlug } from '../../../../modules/activities/web/activityDetailRoute';
import { loadIsBookmarked } from '../../../../modules/calendar/web/loadIsBookmarked';
import { loadIsFavorited } from '../../../../modules/favorites/web/loadIsFavorited';
import { getOptionalUser } from '../../../../shared/auth/current-user';
import type { ActivityDetailDTO } from '../../../../shared/contracts/ActivityDetailDTO';

export async function getActivityDetailRouteHandler(
  _request: Request,
  context: { params: { slug: string } },
): Promise<NextResponse> {
  const activity = await loadActivityDTOBySlug(context.params.slug);
  const dto: ActivityDetailDTO = { ...activity };

  const user = await getOptionalUser();
  if (user) {
    const [isFavorited, isBookmarked] = await Promise.all([
      loadIsFavorited(user.id, activity.id),
      loadIsBookmarked(user.id, activity.id),
    ]);
    dto.isFavorited = isFavorited;
    dto.isBookmarked = isBookmarked;
  }

  return NextResponse.json(dto);
}
