import { defineConfig } from 'vitest/config';

// Integration tests talk to the Postgres pointed at by DATABASE_URL. They are
// serial (shared rows, deterministic ordering) and given a generous timeout.
export default defineConfig({
  test: {
    include: ['**/*.integration.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
