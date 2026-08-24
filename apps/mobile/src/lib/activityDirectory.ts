import type { ActivityDTO } from '@wandr/shared';

export type DirectoryActivity = Pick<ActivityDTO, 'id' | 'slug' | 'title' | 'neighborhood'>;

const directory = new Map<string, DirectoryActivity>();

export function rememberActivity(activity: DirectoryActivity): void {
  directory.set(activity.id, activity);
}

export function getRememberedActivity(activityId: string): DirectoryActivity | undefined {
  return directory.get(activityId);
}
