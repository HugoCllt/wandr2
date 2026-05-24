import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Logger } from 'pino';
import { z } from 'zod';

import type { ConfirmActivityUseCase } from '../../modules/activities/application/ConfirmActivityUseCase';
import { runTool } from '../runTool';

export const confirmActivityInputSchema = z.object({
  activityId: z.string().min(1),
});

export type ConfirmActivityInput = z.infer<typeof confirmActivityInputSchema>;

export type ConfirmActivityResult = { id: string; recheckAfter: string | null };

export type ConfirmActivityDeps = {
  confirm: ConfirmActivityUseCase;
  now: () => Date;
};

export async function confirmActivity(
  deps: ConfirmActivityDeps,
  input: ConfirmActivityInput,
): Promise<ConfirmActivityResult> {
  // Throws "Activity <id> not found." when missing → mapped to a tool error.
  const { recheckAfter } = await deps.confirm.execute({
    activityId: input.activityId,
    now: deps.now(),
  });
  return {
    id: input.activityId,
    recheckAfter: recheckAfter ? recheckAfter.toISOString() : null,
  };
}

export const confirmActivityDescription = [
  'Enregistre qu’une activité existe encore / est toujours pertinente (tu l’as vérifié via le web). Rafraîchit ses timestamps de fraîcheur et repousse la prochaine échéance de recheck. Exactement une décision confirmActivity/archiveActivity par activité et par run.',
  '- activityId — un id issu de listActivitiesDueForRecheck.',
  '- Retour : id, recheckAfter (prochaine échéance ; null pour les EVENT).',
].join('\n');

export function registerConfirmActivity(
  server: McpServer,
  deps: ConfirmActivityDeps,
  logger: Logger,
): void {
  server.registerTool(
    'confirmActivity',
    { description: confirmActivityDescription, inputSchema: confirmActivityInputSchema.shape },
    (args) => {
      const input = args as ConfirmActivityInput;
      return runTool(
        logger,
        'confirmActivity',
        () => confirmActivity(deps, input),
        (result) => ({ level: 'info', fields: { activityId: input.activityId, result } }),
      );
    },
  );
}
