import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Logger } from 'pino';
import { z } from 'zod';

import type { ActivityKind } from '../../modules/activities/domain/Activity';
import type { IActivityIngestionRepository } from '../../modules/activities/domain/IActivityIngestionRepository';
import type { ICityRepository } from '../../modules/activities/domain/ICityRepository';
import { runTool } from '../runTool';

export const listActivitiesDueForRecheckInputSchema = z.object({
  citySlug: z.string().min(1),
  limit: z.number().int().positive().optional(),
});

export type ListActivitiesDueForRecheckInput = z.infer<
  typeof listActivitiesDueForRecheckInputSchema
>;

// lastVerifiedAt is Date | null on the domain entity; we surface it as a
// nullable ISO string rather than asserting non-null.
export type RecheckListItem = {
  id: string;
  title: string;
  kind: ActivityKind;
  address: string;
  latitude: number;
  longitude: number;
  externalUrl: string | null;
  lastVerifiedAt: string | null;
};

export type ListActivitiesDueForRecheckDeps = {
  cities: ICityRepository;
  ingestion: IActivityIngestionRepository;
  now: () => Date;
};

export async function listActivitiesDueForRecheck(
  deps: ListActivitiesDueForRecheckDeps,
  input: ListActivitiesDueForRecheckInput,
): Promise<RecheckListItem[]> {
  const city = await deps.cities.findBySlug(input.citySlug);
  if (!city) {
    // No `outcome` contract here — an unknown city is a malformed call.
    throw new Error(`Unknown city: ${input.citySlug}`);
  }

  const activities = await deps.ingestion.findDueForRecheck(city.id, deps.now(), input.limit);
  return activities.map((a) => ({
    id: a.id,
    title: a.title,
    kind: a.kind,
    address: a.address,
    latitude: a.latitude,
    longitude: a.longitude,
    externalUrl: a.externalUrl,
    lastVerifiedAt: a.lastVerifiedAt ? a.lastVerifiedAt.toISOString() : null,
  }));
}

export const listActivitiesDueForRecheckDescription = [
  'Renvoie jusqu’à limit activités d’une ville dont l’échéance de re-vérification est passée, échéance la plus ancienne d’abord. Appelle-le une seule fois par run de recheck et fige (snapshot) le résultat ; ne le rappelle pas pendant que des sous-agents décident — confirmer repousse les échéances, donc un nouvel appel chevaucherait ou sauterait des items. Découpe toi-même les IDs renvoyés en lots disjoints.',
  'Ne renvoie que des PLACE : les EVENT expirent via leur date de fin et ne sont jamais re-vérifiés par cet outil.',
  '- citySlug — slug de la ville ; ville inconnue → erreur.',
  '- limit (optionnel) — nombre max d’items (entier > 0) ; omis = toutes les activités dues.',
  '- Retour : id, title, kind, address, latitude, longitude, externalUrl, lastVerifiedAt — de quoi re-trouver chaque activité sur le web.',
].join('\n');

export function registerListActivitiesDueForRecheck(
  server: McpServer,
  deps: ListActivitiesDueForRecheckDeps,
  logger: Logger,
): void {
  server.registerTool(
    'listActivitiesDueForRecheck',
    {
      description: listActivitiesDueForRecheckDescription,
      inputSchema: listActivitiesDueForRecheckInputSchema.shape,
    },
    (args) => {
      const input = args as ListActivitiesDueForRecheckInput;
      return runTool(
        logger,
        'listActivitiesDueForRecheck',
        () => listActivitiesDueForRecheck(deps, input),
        (items) => ({
          level: 'info',
          fields: { citySlug: input.citySlug, count: items.length, limit: input.limit ?? null },
        }),
      );
    },
  );
}
