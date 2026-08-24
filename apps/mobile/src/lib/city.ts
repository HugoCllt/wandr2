import AsyncStorage from '@react-native-async-storage/async-storage';

const CITY_STORAGE_KEY = 'wandr.city';
export const DEFAULT_CITY_SLUG = 'montreal';

export async function getCitySlug(): Promise<string> {
  const stored = await AsyncStorage.getItem(CITY_STORAGE_KEY);
  return stored ?? DEFAULT_CITY_SLUG;
}

export async function setCitySlug(slug: string): Promise<void> {
  await AsyncStorage.setItem(CITY_STORAGE_KEY, slug);
}
