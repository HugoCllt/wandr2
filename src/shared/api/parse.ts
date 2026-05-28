import type { z } from 'zod';

/**
 * Parses + validates the JSON body of a request against a Zod schema. Throws a
 * ZodError on invalid input — `handleApiError` maps that to a 400 response, so
 * route handlers don't repeat per-endpoint validation→400 boilerplate.
 *
 * Lives in shared/ so module handlers under src/modules can use it;
 * modules → app is forbidden by dependency-cruiser.
 */
export async function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  request: Request,
): Promise<z.infer<T>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    json = null;
  }
  return schema.parse(json);
}

/** Same idea for query params. `Object.fromEntries` flattens repeats to the last value. */
export function parseQuery<T extends z.ZodTypeAny>(
  schema: T,
  searchParams: URLSearchParams,
): z.infer<T> {
  return schema.parse(Object.fromEntries(searchParams));
}
