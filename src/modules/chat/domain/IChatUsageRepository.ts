import type { TokenUsage } from './TokenUsage';

/**
 * Port for per-user monthly token accounting. `month` is a `"YYYY-MM"` bucket.
 * The adapter persists the running total and the prompt/completion breakdown.
 */
export interface IChatUsageRepository {
  /** Tokens already spent by `userId` in `month` (0 when no row yet). */
  getMonthlyTotal(userId: string, month: string): Promise<number>;
  /** Adds one exchange's usage to the `(userId, month)` bucket. */
  addUsage(userId: string, month: string, usage: TokenUsage): Promise<void>;
}
