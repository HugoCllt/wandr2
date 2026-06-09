import type { PrismaClient } from '@prisma/client';

import type { IChatUsageRepository } from '../domain/IChatUsageRepository';
import type { TokenUsage } from '../domain/TokenUsage';

/**
 * Persists per-user monthly token usage on the `(userId, month)` unique key.
 * `getMonthlyTotal` reads the running `totalTokens`; `addUsage` upserts then
 * increments the three counters atomically.
 */
export class PrismaChatUsageRepository implements IChatUsageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getMonthlyTotal(userId: string, month: string): Promise<number> {
    const row = await this.prisma.chatTokenUsage.findUnique({
      where: { userId_month: { userId, month } },
      select: { totalTokens: true },
    });
    return row?.totalTokens ?? 0;
  }

  async addUsage(userId: string, month: string, usage: TokenUsage): Promise<void> {
    await this.prisma.chatTokenUsage.upsert({
      where: { userId_month: { userId, month } },
      create: {
        userId,
        month,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
      },
      update: {
        promptTokens: { increment: usage.promptTokens },
        completionTokens: { increment: usage.completionTokens },
        totalTokens: { increment: usage.totalTokens },
      },
    });
  }
}
