import type { Activity, ActivityCategory } from '../../../activities/domain/Activity';
import { DEFAULT_MATCH_SCORE, type RankedActivity } from '../../domain/FeedQuery';

export function rank(
  activities: readonly Activity[],
  affinityMap: ReadonlyMap<ActivityCategory, number>,
  _now: Date,
): RankedActivity[] {
  const scored: RankedActivity[] = activities.map((activity) => ({
    ...activity,
    matchScore: affinityMap.get(activity.category) ?? DEFAULT_MATCH_SCORE,
  }));

  return scored.sort(compareRanked);
}

function compareRanked(a: RankedActivity, b: RankedActivity): number {
  if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;

  if (a.matchScore !== b.matchScore) return b.matchScore - a.matchScore;

  const dateCmp = compareDateStartNullsLast(a.dateStart, b.dateStart);
  if (dateCmp !== 0) return dateCmp;

  const createdCmp = b.createdAt.getTime() - a.createdAt.getTime();
  if (createdCmp !== 0) return createdCmp;

  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

function compareDateStartNullsLast(a: Date | null, b: Date | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.getTime() - b.getTime();
}
