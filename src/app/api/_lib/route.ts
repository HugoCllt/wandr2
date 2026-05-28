import { handleApiError } from './error-handler';

/**
 * Wraps a route handler in the single try/catch that delegates to handleApiError.
 * Every route.ts file under app/api uses this — handlers throw their errors and
 * `handleApiError` decides the HTTP status from the error type (single seam).
 *
 *   export const POST = route(addToCalendarRouteHandler);
 *
 * Generic over the handler's args so it works for both `(request)` and
 * `(request, { params })` (dynamic segments).
 */
export function route<Args extends unknown[]>(
  handler: (request: Request, ...args: Args) => Promise<Response>,
): (request: Request, ...args: Args) => Promise<Response> {
  return async (request, ...args) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
