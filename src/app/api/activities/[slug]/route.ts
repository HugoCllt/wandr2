import { NextResponse } from 'next/server';

import { loadIsBookmarked } from '../../../../modules/calendar/web/loadIsBookmarked';
import { loadIsFavorited } from '../../../../modules/favorites/web/loadIsFavorited';
import { loadActivityDTOBySlug } from '../../../../modules/activities/web/activityDetailRoute';
import { getOptionalUser } from '../../../../shared/auth/current-user';
import type { ActivityDetailDTO } from '../../../../shared/contracts/ActivityDetailDTO';
import { withRoute } from '../../_lib/withRoute';

export const dynamic = 'force-dynamic';

async function getActivityDetailRouteHandler(
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

export const GET = withRoute(getActivityDetailRouteHandler);
