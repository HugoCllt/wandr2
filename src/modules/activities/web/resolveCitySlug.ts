const FALLBACK_CITY_SLUG = 'montreal';

export type ResolveCitySlugInput = {
  headerSlug: string | null;
  cookieSlug: string | null;
  profileSlug: string | null;
};

export function resolveCitySlug({ headerSlug, cookieSlug, profileSlug }: ResolveCitySlugInput): string {
  const header = headerSlug?.trim();
  if (header) return header;
  if (cookieSlug) return cookieSlug;
  if (profileSlug) return profileSlug;
  return FALLBACK_CITY_SLUG;
}
