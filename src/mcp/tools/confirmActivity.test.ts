import { describe, expect, it } from 'vitest';

import { ConfirmActivityUseCase } from '../../modules/activities/application/ConfirmActivityUseCase';
import type { Activity } from '../../modules/activities/domain/Activity';
import type {
  FreshnessUpdate,
  IActivityIngestionRepository,
} from '../../modules/activities/domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../../modules/activities/domain/IActivityRepository';
import { confirmActivity } from './confirmActivity';

const NOW = new Date('2026-05-23T12:00:00.000Z');

function activity(id: string, kind: Activity['kind']): Activity {
  return { ...({} as Activity), id, kind } as Activity;
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
  const confirm = new ConfirmActivityUseCase(
    new FakeActivities(map) as unknown as IActivityRepository,
    ingestion,
  );
  return { deps: { confirm, now: () => NOW }, ingestion };
}

describe('confirmActivity handler', () => {
  it('returns the id and the next recheckAfter as ISO for a PLACE', async () => {
    const { deps } = build(new Map([['a', activity('a', 'PLACE')]]));

    const result = await confirmActivity(deps, { activityId: 'a' });

    expect(result).toEqual({ id: 'a', recheckAfter: '2026-08-21T12:00:00.000Z' });
  });

  it('returns recheckAfter null for an EVENT', async () => {
    const { deps } = build(new Map([['e', activity('e', 'EVENT')]]));

    const result = await confirmActivity(deps, { activityId: 'e' });

    expect(result).toEqual({ id: 'e', recheckAfter: null });
  });

  it('throws a tool error when the activity does not exist', async () => {
    const { deps } = build(new Map());

    await expect(confirmActivity(deps, { activityId: 'missing' })).rejects.toThrow(/not found/);
  });
});
