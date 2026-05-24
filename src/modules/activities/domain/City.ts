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

export function isWithinCityBbox(city: City, latitude: number, longitude: number): boolean {
  return (
    latitude >= city.bboxMinLat &&
    latitude <= city.bboxMaxLat &&
    longitude >= city.bboxMinLng &&
    longitude <= city.bboxMaxLng
  );
}
