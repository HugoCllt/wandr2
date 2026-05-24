import { describe, expect, it } from 'vitest';

import type { Activity } from '../domain/Activity';
import type {
  FreshnessUpdate,
  IActivityIngestionRepository,
} from '../domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../domain/IActivityRepository';
import { ConfirmActivityUseCase } from './ConfirmActivityUseCase';

const NOW = new Date('2026-05-23T12:00:00.000Z');

function activity(id: string, kind: Activity['kind']): Activity {
  return { ...({} as Activity), id, slug: id, kind, cityId: 'city_mtl' } as Activity;
}

class FakeActivities {
  constructor(private readonly byId: Map<string, Activity>) {}
  async findById(id: string): Promise<Activity | null> {
    return this.byId.get(id) ?? null;
  }
}

class FakeIngestion implements IActivityIngestionRepository {
  readonly refreshed: Array<{ id: string; update: FreshnessUpdate }> = [];
  async findByCityAndDedupeKey(): Promise<Activity | null> {
    return null;
  }
  async refreshFreshness(id: string, update: FreshnessUpdate): Promise<void> {
    this.refreshed.push({ id, update });
  }
  async findDueForRecheck(): Promise<Activity[]> {
    return [];
  }
  async archive(): Promise<void> {}
}

function build(map: Map<string, Activity>) {
  const ingestion = new FakeIngestion();
  const useCase = new ConfirmActivityUseCase(
    new FakeActivities(map) as unknown as IActivityRepository,
    ingestion,
  );
  return { useCase, ingestion };
}

describe('ConfirmActivityUseCase', () => {
  it('refreshes freshness and recomputes recheckAfter (+90d) for a PLACE', async () => {
    const { useCase, ingestion } = build(new Map([['a', activity('a', 'PLACE')]]));

    await useCase.execute({ activityId: 'a', now: NOW });

    expect(ingestion.refreshed).toEqual([
      {
        id: 'a',
        update: {
          lastSeenAt: NOW,
          lastVerifiedAt: NOW,
          recheckAfter: new Date('2026-08-21T12:00:00.000Z'),
        },
      },
    ]);
  });

  it('sets recheckAfter null for an EVENT', async () => {
    const { useCase, ingestion } = build(new Map([['e', activity('e', 'EVENT')]]));

    await useCase.execute({ activityId: 'e', now: NOW });

    expect(ingestion.refreshed[0].update.recheckAfter).toBeNull();
  });

  it('throws when the activity does not exist', async () => {
    const { useCase } = build(new Map());

    await expect(useCase.execute({ activityId: 'missing', now: NOW })).rejects.toThrow(/not found/);
  });
});
