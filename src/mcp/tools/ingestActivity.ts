import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Logger } from 'pino';
import { z } from 'zod';

import type {
  PromoteCandidateUseCase,
  PromotionResult,
} from '../../modules/activities/application/PromoteCandidateUseCase';
import { ActivityCategories, ActivityKinds } from '../../modules/activities/domain/Activity';
import type { ICandidateRepository } from '../../modules/activities/domain/ICandidateRepository';
import type { ICityRepository } from '../../modules/activities/domain/ICityRepository';
import type { ExtractedActivityPayload } from '../../modules/activities/domain/RawActivityCandidate';
import { runTool } from '../runTool';

// Layer A (spec §4.1): structural validation only. Required fields carry meaning
// for every activity; the rest are often absent and default to null when omitted.
// `.default(null)` keeps the OUTPUT type `T | null`, so `z.infer` stays IDENTICAL
// to ExtractedActivityPayload — drift becomes a compile error in the handler, and
// there is no transform/cast to maintain. Business rules (e.g. EVENT ⇒ dateStart)
// are NOT encoded here — they live in the domain (Layer B → REJECTED + reason).
const payloadSchema = z.object({
  // Required
  title: z.string().min(1),
  description: z.string().min(1),
  kind: z.enum(ActivityKinds),
  categories: z.object({
    primary: z.enum(ActivityCategories),
    secondary: z.array(z.enum(ActivityCategories)).max(2).default([]),
  }),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  indoor: z.boolean(),
  outdoor: z.boolean(),
  // Optional — omitted ⇒ null
  imageUrl: z.string().url().nullable().default(null),
  neighborhood: z.string().nullable().default(null),
  dateStart: z.string().datetime().nullable().default(null),
  dateEnd: z.string().datetime().nullable().default(null),
  // `0` means "actually free"; omitted (null) means "price unknown". Conflating
  // the two is what made two thirds of the catalogue read as free.
  priceMinCents: z.number().int().nonnegative().nullable().default(null),
  priceMaxCents: z.number().int().nonnegative().nullable().default(null),
  externalUrl: z.string().url().nullable().default(null),
});

const metaSchema = z.object({
  agentName: z.string().min(1),
  searchQuery: z.string().min(1),
  sourceUrl: z.string().url(),
  rawExcerpt: z.string().min(1),
  category: z.enum(ActivityCategories),
});

export const ingestActivityInputSchema = z.object({
  citySlug: z.string().min(1),
  payload: payloadSchema,
  meta: metaSchema,
});

export type IngestActivityInput = z.infer<typeof ingestActivityInputSchema>;

export type IngestActivityDeps = {
  cities: ICityRepository;
  candidates: ICandidateRepository;
  promote: PromoteCandidateUseCase;
  now: () => Date;
};

// Staging sentinel: the authoritative dedupeKey is (re)computed from the payload
// inside PromoteCandidateUseCase. We can't compute it here because computeDedupeKey
// throws for an EVENT without dateStart, and we must stage EVERY candidate (even
// future rejects) for the audit trail before judging it.
const STAGED_DEDUPE_KEY = 'pending-promotion';

export async function ingestActivity(
  deps: IngestActivityDeps,
  input: IngestActivityInput,
): Promise<PromotionResult> {
  const city = await deps.cities.findBySlug(input.citySlug);
  if (!city) {
    // Unknown city is bad DATA, not a bad call → REJECTED, and we stage nothing.
    return { outcome: 'REJECTED', activityId: null, reason: `Unknown city: ${input.citySlug}` };
  }

  const payload: ExtractedActivityPayload = input.payload;
  const candidate = await deps.candidates.create({
    cityId: city.id,
    category: input.meta.category, // agent's search theme, for traceability
    agentName: input.meta.agentName,
    searchQuery: input.meta.searchQuery,
    sourceUrl: input.meta.sourceUrl,
    rawExcerpt: input.meta.rawExcerpt,
    extractedPayload: payload, // payload.categories is the activity's real category set
    dedupeKey: STAGED_DEDUPE_KEY,
  });

  return deps.promote.execute({ candidateId: candidate.id, now: deps.now() });
}

export const ingestActivityDescription = [
  'Enregistre UNE activité que tu as extraite du web pour une ville, puis la fait passer par validation + déduplication + création/rafraîchissement. Appelle-le une fois par activité plausible trouvée — ne pré-filtre pas les doublons toi-même, l’outil déduplique. Lis l’outcome pour savoir quoi rapporter.',
  '- citySlug — slug de la ville (ex. "montreal"). Ville inconnue → REJECTED.',
  "- payload — la donnée façon Activity que tu as extraite. latitude/longitude doivent tomber dans la ville ; un kind 'EVENT' exige dateStart ET dateEnd (ISO 8601 ; événement d'un seul jour → dateEnd = dateStart ; dateEnd ≥ dateStart) ; un kind 'PLACE' ne doit avoir ni dateStart ni dateEnd ; indoor et outdoor requis (deux booléens, pose les deux) ; payload.categories = { primary, secondary } = les catégories réelles de l’activité : primary = sa nature dominante, secondary = 0 à 2 autres catégories distinctes (≠ primary) qu’elle sert vraiment (0 est normal, ne remplis pas pour remplir). Champs optionnels (omis ⇒ null) : imageUrl, neighborhood, dateStart, dateEnd, priceMinCents, priceMaxCents, externalUrl. priceMinCents en cents entiers : mets-le UNIQUEMENT si la source donne le prix — `0` veut dire « l'entrée est réellement gratuite », jamais « je ne sais pas » ; prix inconnu ⇒ omets le champ. Un restaurant, un bar ou une boîte sans tarif trouvé : omets, ne mets pas 0.",
  '- meta — provenance : agentName (ton nom), searchQuery (la requête qui l’a trouvée), sourceUrl, rawExcerpt (le texte d’où tu as extrait), category (ton thème de recherche, peut différer de payload.categories.primary).',
  '- Outcomes : PROMOTED = nouvelle activité créée ; DUPLICATE = a matché une existante (fraîcheur rafraîchie) ; REJECTED = la donnée a échoué une règle métier — lis reason et corrige la donnée (pas la forme de l’appel).',
].join('\n');

export function registerIngestActivity(
  server: McpServer,
  deps: IngestActivityDeps,
  logger: Logger,
): void {
  server.registerTool(
    'ingestActivity',
    { description: ingestActivityDescription, inputSchema: ingestActivityInputSchema.shape },
    (args) => {
      const input = args as IngestActivityInput;
      return runTool(
        logger,
        'ingestActivity',
        () => ingestActivity(deps, input),
        (result) => ({
          level: result.outcome === 'REJECTED' ? 'warn' : 'info',
          fields: {
            agentName: input.meta.agentName,
            searchQuery: input.meta.searchQuery,
            sourceUrl: input.meta.sourceUrl,
            outcome: result.outcome,
            ...(result.outcome === 'REJECTED'
              ? { reason: result.reason }
              : { activityId: result.activityId }),
          },
        }),
      );
    },
  );
}
