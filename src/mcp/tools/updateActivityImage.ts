import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Logger } from 'pino';
import { z } from 'zod';

import type { IActivityIngestionRepository } from '../../modules/activities/domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../../modules/activities/domain/IActivityRepository';
import { runTool } from '../runTool';

export const updateActivityImageInputSchema = z.object({
  activityId: z.string().min(1),
  imageUrl: z.string().url(),
});

export type UpdateActivityImageInput = z.infer<typeof updateActivityImageInputSchema>;

export type UpdateActivityImageResult = { id: string; imageUrl: string };

export type UpdateActivityImageDeps = {
  activities: Pick<IActivityRepository, 'findById'>;
  ingestion: Pick<IActivityIngestionRepository, 'updateImageUrl'>;
};

export async function updateActivityImage(
  deps: UpdateActivityImageDeps,
  input: UpdateActivityImageInput,
): Promise<UpdateActivityImageResult> {
  const activity = await deps.activities.findById(input.activityId);
  if (!activity) throw new Error(`Activity ${input.activityId} not found.`);
  await deps.ingestion.updateImageUrl(input.activityId, input.imageUrl);
  return { id: input.activityId, imageUrl: input.imageUrl };
}

export const updateActivityImageDescription = [
  "Met à jour l'imageUrl d'une activité existante. Appelle-le après avoir trouvé et validé une URL d'image directe.",
  "- activityId — id de l'activité (issu de listActivities). Id inconnu → erreur.",
  "- imageUrl — URL d'image directe et valide (http(s)://…, idéalement .jpg/.jpeg/.png/.webp).",
  '- Retour : id, imageUrl mis à jour.',
].join('\n');

export function registerUpdateActivityImage(
  server: McpServer,
  deps: UpdateActivityImageDeps,
  logger: Logger,
): void {
  server.registerTool(
    'updateActivityImage',
    {
      description: updateActivityImageDescription,
      inputSchema: updateActivityImageInputSchema.shape,
    },
    (args) => {
      const input = args as UpdateActivityImageInput;
      return runTool(
        logger,
        'updateActivityImage',
        () => updateActivityImage(deps, input),
        (result) => ({ level: 'info', fields: { activityId: input.activityId, result } }),
      );
    },
  );
}
