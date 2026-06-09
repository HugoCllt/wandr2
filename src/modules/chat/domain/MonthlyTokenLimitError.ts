/** Thrown when a user's monthly token cap is reached. Mapped to 429. */
export class MonthlyTokenLimitError extends Error {
  constructor() {
    super('Monthly chat token limit reached.');
    this.name = 'MonthlyTokenLimitError';
  }
}
