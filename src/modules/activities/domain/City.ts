export type City = {
  id: string;
  slug: string;
  name: string;
  country: string;
  timezone: string;
  centerLat: number;
  centerLng: number;
  bboxMinLat: number;
  bboxMinLng: number;
  bboxMaxLat: number;
  bboxMaxLng: number;
};

export type CityCreateInput = Omit<City, 'id'>;

const SLUG_PATTERN = /^[a-z0-9-]+$/;

export function isWithinCityBbox(city: City, latitude: number, longitude: number): boolean {
  return (
    latitude >= city.bboxMinLat &&
    latitude <= city.bboxMaxLat &&
    longitude >= city.bboxMinLng &&
    longitude <= city.bboxMaxLng
  );
}

export function validateCity(input: CityCreateInput): void {
  if (!SLUG_PATTERN.test(input.slug)) {
    throw new Error('City slug must contain only lowercase letters, numbers, and hyphens.');
  }
  if (input.name.trim() === '') throw new Error('City name is required.');
  if (input.country.trim() === '') throw new Error('City country is required.');
  if (input.timezone.trim() === '') throw new Error('City timezone is required.');

  const coords = [
    input.centerLat,
    input.centerLng,
    input.bboxMinLat,
    input.bboxMinLng,
    input.bboxMaxLat,
    input.bboxMaxLng,
  ];
  if (!coords.every((n) => Number.isFinite(n))) {
    throw new Error('City coordinates must be finite numbers.');
  }
  if (input.bboxMinLat >= input.bboxMaxLat || input.bboxMinLng >= input.bboxMaxLng) {
    throw new Error('City bbox minimums must be strictly lower than its maximums.');
  }
  if (!isWithinCityBbox({ ...input, id: '' }, input.centerLat, input.centerLng)) {
    throw new Error('City center must fall inside its own bbox.');
  }
}
