import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Logger } from 'pino';
import { z } from 'zod';

import type { IActivityIngestionRepository } from '../../modules/activities/domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../../modules/activities/domain/IActivityRepository';
import { runTool } from '../runTool';

export const archiveActivityInputSchema = z.object({
  activityId: z.string().min(1),
});

export type ArchiveActivityInput = z.infer<typeof archiveActivityInputSchema>;

export type ArchiveActivityResult = { id: string; status: 'ARCHIVED' };

export type ArchiveActivityDeps = {
  activities: Pick<IActivityRepository, 'findById'>;
  ingestion: IActivityIngestionRepository;
};

export async function archiveActivity(
  deps: ArchiveActivityDeps,
  input: ArchiveActivityInput,
): Promise<ArchiveActivityResult> {
  // Pre-check for a clear, agent-actionable error (consistent with confirmActivity)
  // rather than leaking Prisma's generic P2025 message. No status guard: any
  // existing activity goes PUBLISHED → ARCHIVED.
  const activity = await deps.activities.findById(input.activityId);
  if (!activity) {
    throw new Error(`Activity ${input.activityId} not found.`);
  }
  await deps.ingestion.archive(input.activityId);
  return { id: input.activityId, status: 'ARCHIVED' };
}

export const archiveActivityDescription = [
  'Enregistre qu’une activité a fermé / disparu / n’est plus pertinente. Passe son statut PUBLISHED → ARCHIVED pour la sortir du feed. Exactement une décision confirmActivity/archiveActivity par activité et par run. N’archive que sur preuve web claire.',
  '- activityId — un id issu de listActivitiesDueForRecheck.',
  "- Retour : id, status ('ARCHIVED').",
].join('\n');

export function registerArchiveActivity(
  server: McpServer,
  deps: ArchiveActivityDeps,
  logger: Logger,
): void {
  server.registerTool(
    'archiveActivity',
    { description: archiveActivityDescription, inputSchema: archiveActivityInputSchema.shape },
    (args) => {
      const input = args as ArchiveActivityInput;
      return runTool(
        logger,
        'archiveActivity',
        () => archiveActivity(deps, input),
        (result) => ({ level: 'info', fields: { activityId: input.activityId, result } }),
      );
    },
  );
}
