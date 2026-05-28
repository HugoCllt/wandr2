import { handleApiError } from './error-handler';

/**
 * Higher-order wrapper for Next.js route handlers. Adds the single try/catch
 * that delegates to handleApiError so each route.ts collapses to one line:
 *
 *   export const POST = withRoute(addToCalendarRouteHandler);
 *
 * Handlers throw their errors and `handleApiError` decides the HTTP status
 * from the error type (single seam). Generic over the handler's args so it
 * works for both `(request)` and `(request, { params })` (dynamic segments).
 *
 * Lives in `_lib/withRoute.ts` (not `route.ts`) because Next.js claims any
 * file literally named `route.ts` as an HTTP route handler module.
 */
export function withRoute<Args extends unknown[]>(
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
