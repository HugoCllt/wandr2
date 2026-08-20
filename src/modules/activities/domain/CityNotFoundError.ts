export class CityNotFoundError extends Error {
  constructor(slug: string) {
    super(`City not found: ${slug}`);
    this.name = 'CityNotFoundError';
  }
}
