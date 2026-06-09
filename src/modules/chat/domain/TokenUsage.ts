/** Token counts for a single chat exchange, summed into the monthly bucket. */
export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};
