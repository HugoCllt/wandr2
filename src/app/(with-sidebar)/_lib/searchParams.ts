/**
 * Next.js page `searchParams` come in as a `Record<string, string | string[] | undefined>`.
 * Every page that calls into the feed needs to flatten this into a `URLSearchParams` —
 * extracted once so the dynamic `[category]`, home, and design-showcase routes share it.
 */
export type SearchParamsInput = Record<string, string | string[] | undefined>;

export function toURLSearchParams(searchParams: SearchParamsInput): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value[0]);
    } else {
      params.set(key, value);
    }
  }
  return params;
}
