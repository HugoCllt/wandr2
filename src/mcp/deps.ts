import type { PrismaClient } from '@prisma/client';

import { ConfirmActivityUseCase } from '../modules/activities/application/ConfirmActivityUseCase';
import { PromoteCandidateUseCase } from '../modules/activities/application/PromoteCandidateUseCase';
import { PrismaActivityRepository } from '../modules/activities/infra/PrismaActivityRepository';
import { PrismaCandidateRepository } from '../modules/activities/infra/PrismaCandidateRepository';
import { PrismaCityRepository } from '../modules/activities/infra/PrismaCityRepository';
import type { ArchiveActivityDeps } from './tools/archiveActivity';
import type { ConfirmActivityDeps } from './tools/confirmActivity';
import type { EnsureCityDeps } from './tools/ensureCity';
import type { IngestActivityDeps } from './tools/ingestActivity';
import type { ListActivitiesDeps } from './tools/listActivities';
import type { ListActivitiesDueForRecheckDeps } from './tools/listActivitiesDueForRecheck';
import type { UpdateActivityImageDeps } from './tools/updateActivityImage';

export type ToolDeps = {
  ensureCity: EnsureCityDeps;
  ingest: IngestActivityDeps;
  list: ListActivitiesDueForRecheckDeps;
  confirm: ConfirmActivityDeps;
  archive: ArchiveActivityDeps;
  listActivities: ListActivitiesDeps;
  updateImage: UpdateActivityImageDeps;
};

/**
 * Composition root for the MCP tools. Instantiates the Prisma repos once and
 * wires the foundation use cases. `now` is server-provided (spec Q10) and not
 * overridable by the agent; tests inject a fixed clock.
 */
export function createDeps(prisma: PrismaClient, now: () => Date = () => new Date()): ToolDeps {
  const activities = new PrismaActivityRepository(prisma);
  const candidates = new PrismaCandidateRepository(prisma);
  const cities = new PrismaCityRepository(prisma);
  const promote = new PromoteCandidateUseCase(activities, activities, candidates, cities);
  const confirm = new ConfirmActivityUseCase(activities, activities);

  return {
    ensureCity: { cities, cityWrites: cities },
    ingest: { cities, candidates, promote, now },
    list: { cities, ingestion: activities, now },
    confirm: { confirm, now },
    archive: { activities, ingestion: activities },
    listActivities: { cities, activities },
    updateImage: { activities, ingestion: activities },
  };
}
