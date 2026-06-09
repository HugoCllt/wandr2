/** Thrown when a non-premium user reaches a premium-only capability. Mapped to 403. */
export class PremiumRequiredError extends Error {
  constructor() {
    super('Premium membership required.');
    this.name = 'PremiumRequiredError';
  }
}
