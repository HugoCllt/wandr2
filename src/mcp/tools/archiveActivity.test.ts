import { describe, expect, it } from 'vitest';

import type { Activity } from '../../modules/activities/domain/Activity';
import type { IActivityIngestionRepository } from '../../modules/activities/domain/IActivityIngestionRepository';
import { archiveActivity } from './archiveActivity';

class FakeActivities {
  constructor(private readonly known: Set<string>) {}
  async findById(id: string): Promise<Activity | null> {
    return this.known.has(id) ? ({ ...({} as Activity), id } as Activity) : null;
  }
}

class FakeIngestion implements IActivityIngestionRepository {
  readonly archived: string[] = [];
  async findByCityAndDedupeKey(): Promise<Activity | null> {
    return null;
  }
  async refreshFreshness(): Promise<void> {}
  async findDueForRecheck(): Promise<Activity[]> {
    return [];
  }
  async archive(id: string): Promise<void> {
    this.archived.push(id);
  }
  async updateImageUrl(): Promise<void> {}
}

describe('archiveActivity handler', () => {
  it('archives an existing activity and returns { id, status: ARCHIVED }', async () => {
    const ingestion = new FakeIngestion();
    const deps = { activities: new FakeActivities(new Set(['a'])), ingestion };

    const result = await archiveActivity(deps, { activityId: 'a' });

    expect(result).toEqual({ id: 'a', status: 'ARCHIVED' });
    expect(ingestion.archived).toEqual(['a']);
  });

  it('throws a tool error and never archives when the activity does not exist', async () => {
    const ingestion = new FakeIngestion();
    const deps = { activities: new FakeActivities(new Set()), ingestion };

    await expect(archiveActivity(deps, { activityId: 'missing' })).rejects.toThrow(/not found/);
    expect(ingestion.archived).toEqual([]);
  });
});
