import { configDefaults, defineConfig } from 'vitest/config';

// Default run = unit tests only. Integration tests hit a real Postgres and are
// opt-in via `pnpm test:integration` (vitest.integration.config.ts).
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/*.integration.test.ts'],
  },
});
