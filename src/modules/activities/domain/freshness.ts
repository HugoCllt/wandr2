import type { ActivityKind } from './Activity';

export const RECHECK_INTERVAL_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeExpiresAt(input: { kind: ActivityKind; dateEnd: Date | null }): Date | null {
  if (input.kind === 'EVENT') {
    if (!input.dateEnd) {
      throw new Error('computeExpiresAt: EVENT requires dateEnd.');
    }
    return input.dateEnd;
  }
  return null;
}

export function computeRecheckAfter(input: { kind: ActivityKind; lastSeenAt: Date }): Date | null {
  if (input.kind === 'EVENT') {
    return null;
  }
  return new Date(input.lastSeenAt.getTime() + RECHECK_INTERVAL_DAYS * MS_PER_DAY);
}
