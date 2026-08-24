export const FALLBACK_CITY_SLUG = 'montreal';

export type ResolveCityCandidatesInput = {
  headerSlug: string | null;
  cookieSlug: string | null;
  profileSlug: string | null;
};

export function resolveCityCandidates({
  headerSlug,
  cookieSlug,
  profileSlug,
}: ResolveCityCandidatesInput): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  for (const raw of [headerSlug, cookieSlug, profileSlug, FALLBACK_CITY_SLUG]) {
    const trimmed = raw?.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      candidates.push(trimmed);
    }
  }

  return candidates;
}
