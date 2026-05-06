export class ActivityNotFoundError extends Error {
  constructor(slug: string) {
    super(`Activity not found: ${slug}`);
    this.name = 'ActivityNotFoundError';
  }
}
