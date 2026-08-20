import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Logger } from 'pino';
import { z } from 'zod';

import { validateCity, type CityCreateInput } from '../../modules/activities/domain/City';
import type { ICityRepository } from '../../modules/activities/domain/ICityRepository';
import type { ICityWriteRepository } from '../../modules/activities/domain/ICityWriteRepository';
import { runTool } from '../runTool';

export const ensureCityInputSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  country: z.string().min(1),
  timezone: z.string().min(1),
  centerLat: z.number(),
  centerLng: z.number(),
  bboxMinLat: z.number(),
  bboxMinLng: z.number(),
  bboxMaxLat: z.number(),
  bboxMaxLng: z.number(),
});

export type EnsureCityInput = z.infer<typeof ensureCityInputSchema>;

export type EnsureCityResult = {
  outcome: 'CREATED' | 'EXISTS';
  slug: string;
  name: string;
};

export type EnsureCityDeps = {
  cities: ICityRepository;
  cityWrites: ICityWriteRepository;
};

export async function ensureCity(
  deps: EnsureCityDeps,
  input: EnsureCityInput,
): Promise<EnsureCityResult> {
  const existing = await deps.cities.findBySlug(input.slug);
  if (existing) {
    return { outcome: 'EXISTS', slug: existing.slug, name: existing.name };
  }

  const createInput: CityCreateInput = input;
  validateCity(createInput);

  const created = await deps.cityWrites.create(createInput);
  return { outcome: 'CREATED', slug: created.slug, name: created.name };
}

export const ensureCityDescription = [
  "Garantit qu'une ville existe en base avant toute ingestion. Appelle-le UNE fois, avant les scouts : sans ville en base, chaque ingestActivity repart en REJECTED.",
  '- slug — identifiant en minuscules, chiffres et tirets (ex. "new-york"). Ville déjà connue → EXISTS, rien n\'est écrit ni écrasé.',
  '- name, country, timezone — nom affiché (ex. "New York"), code pays ISO ("US"), fuseau IANA ("America/New_York").',
  "- centerLat / centerLng — centre-ville. bboxMinLat / bboxMinLng / bboxMaxLat / bboxMaxLng — cadre englobant l'agglomération : c'est lui qui rejettera plus tard les activités hors ville, vise l'aire urbaine réelle, ni le seul centre ni la province.",
  '- Le centre doit tomber dans la bbox et chaque minimum être strictement inférieur à son maximum, sinon erreur.',
  '- Outcomes : CREATED = ville insérée ; EXISTS = ville déjà présente.',
].join('\n');

export function registerEnsureCity(server: McpServer, deps: EnsureCityDeps, logger: Logger): void {
  server.registerTool(
    'ensureCity',
    { description: ensureCityDescription, inputSchema: ensureCityInputSchema.shape },
    (args) => {
      const input = args as EnsureCityInput;
      return runTool(
        logger,
        'ensureCity',
        () => ensureCity(deps, input),
        (result) => ({
          level: 'info',
          fields: { slug: result.slug, outcome: result.outcome },
        }),
      );
    },
  );
}
