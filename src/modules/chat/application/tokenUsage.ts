import type { AIMessage, AIMessageChunk } from '@langchain/core/messages';

import type { TokenUsage } from '../domain/TokenUsage';

export const ZERO_USAGE: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

/** Ollama's OpenAI-compatible endpoint may omit usage; fall back to zeros. */
export function toTokenUsage(
  meta: AIMessage['usage_metadata'] | AIMessageChunk['usage_metadata'] | undefined,
): TokenUsage {
  return meta
    ? {
        promptTokens: meta.input_tokens ?? 0,
        completionTokens: meta.output_tokens ?? 0,
        totalTokens: meta.total_tokens ?? 0,
      }
    : ZERO_USAGE;
}

/** Sums two usage tallies — the reducer behind the graph's `usage` channel. */
export function addTokenUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    totalTokens: a.totalTokens + b.totalTokens,
  };
}
