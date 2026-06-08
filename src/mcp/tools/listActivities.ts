import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Logger } from 'pino';
import { z } from 'zod';

import { ActivityKinds, type ActivityKind } from '../../modules/activities/domain/Activity';
import type { IActivityRepository } from '../../modules/activities/domain/IActivityRepository';
import type { ICityRepository } from '../../modules/activities/domain/ICityRepository';
import { runTool } from '../runTool';

export const listActivitiesInputSchema = z.object({
  citySlug: z.string().min(1),
  kind: z.enum(ActivityKinds).optional(),
  withoutImage: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
});

export type ListActivitiesInput = z.infer<typeof listActivitiesInputSchema>;

// Just enough to re-find each activity on the web and decide what to update.
export type ActivityListItem = {
  id: string;
  title: string;
  kind: ActivityKind;
  address: string;
  externalUrl: string | null;
  imageUrl: string | null;
};

export type ListActivitiesDeps = {
  cities: ICityRepository;
  activities: Pick<IActivityRepository, 'listForUpdate'>;
};

export async function listActivities(
  deps: ListActivitiesDeps,
  input: ListActivitiesInput,
): Promise<ActivityListItem[]> {
  const city = await deps.cities.findBySlug(input.citySlug);
  if (!city) throw new Error(`Unknown city: ${input.citySlug}`);

  const activities = await deps.activities.listForUpdate(city.id, {
    kind: input.kind,
    withoutImage: input.withoutImage,
    limit: input.limit,
  });

  return activities.map((a) => ({
    id: a.id,
    title: a.title,
    kind: a.kind,
    address: a.address,
    externalUrl: a.externalUrl,
    imageUrl: a.imageUrl,
  }));
}

export const listActivitiesDescription = [
  "Liste les activités PUBLISHED d'une ville, avec filtres optionnels, pour les traiter ensuite (ex. leur trouver une image).",
  '- citySlug — slug de la ville (ex. "montreal"). Ville inconnue → erreur.',
  '- kind (optionnel) — "EVENT" ou "PLACE" ; omis = les deux.',
  '- withoutImage (optionnel) — true = seulement les activités sans imageUrl.',
  "- limit (optionnel) — nombre max d'items (entier > 0).",
  '- Retour : id, title, kind, address, externalUrl, imageUrl.',
].join('\n');

export function registerListActivities(
  server: McpServer,
  deps: ListActivitiesDeps,
  logger: Logger,
): void {
  server.registerTool(
    'listActivities',
    { description: listActivitiesDescription, inputSchema: listActivitiesInputSchema.shape },
    (args) => {
      const input = args as ListActivitiesInput;
      return runTool(
        logger,
        'listActivities',
        () => listActivities(deps, input),
        (items) => ({
          level: 'info',
          fields: { citySlug: input.citySlug, count: items.length, filter: input },
        }),
      );
    },
  );
}
