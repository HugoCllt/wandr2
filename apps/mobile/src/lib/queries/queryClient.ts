import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api';
import { authClient } from '../auth-client';

let tearingDown = false;

function handleUnauthorized(error: unknown): void {
  if (!(error instanceof ApiError) || error.status !== 401) return;
  if (tearingDown) return;
  tearingDown = true;
  void authClient
    .signOut()
    .catch(() => undefined)
    .finally(() => {
      queryClient.clear();
      tearingDown = false;
    });
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthorized }),
  mutationCache: new MutationCache({ onError: handleUnauthorized }),
  defaultOptions: {
    queries: {
      retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 1,
      staleTime: 60_000,
    },
  },
});
