import type { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { createDeps } from './deps';

describe('createDeps', () => {
  it('builds all tool bundles with a defaulted now provider', () => {
    const deps = createDeps({} as PrismaClient);

    expect(Object.keys(deps).sort()).toEqual([
      'archive',
      'confirm',
      'ensureCity',
      'ingest',
      'list',
      'listActivities',
      'updateImage',
    ]);
    expect(deps.ingest.now()).toBeInstanceOf(Date);
    expect(deps.list.now()).toBeInstanceOf(Date);
    expect(deps.confirm.now()).toBeInstanceOf(Date);
  });

  it('uses the injected clock so callers can drive time deterministically', () => {
    const fixed = new Date('2026-05-23T12:00:00.000Z');
    const deps = createDeps({} as PrismaClient, () => fixed);

    expect(deps.ingest.now()).toBe(fixed);
  });
});
