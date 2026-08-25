export const FALLBACK_CITY_SLUG = 'montreal';

export type ResolveCityCandidatesInput = {
  headerSlug: string | null;
  cookieSlug: string | null;
  profileSlug: string | null;
};

function dedupeTrimmed(raws: (string | null)[]): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  for (const raw of raws) {
    const trimmed = raw?.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      candidates.push(trimmed);
    }
  }

  return candidates;
}

export function resolveEagerCityCandidates({
  headerSlug,
  cookieSlug,
}: Omit<ResolveCityCandidatesInput, 'profileSlug'>): string[] {
  return dedupeTrimmed([headerSlug, cookieSlug]);
}

export function resolveCityCandidates({
  headerSlug,
  cookieSlug,
  profileSlug,
}: ResolveCityCandidatesInput): string[] {
  return dedupeTrimmed([headerSlug, cookieSlug, profileSlug, FALLBACK_CITY_SLUG]);
}
