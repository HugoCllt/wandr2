# Design (à brainstormer) — Serveur MCP d'ingestion & re-vérification

- **Date :** 2026-05-23
- **Statut :** À BRAINSTORMER — design non démarré. Ce fichier capture les décisions prises pendant le grilling du plan d'ingestion, et liste ce qu'il reste à trancher avant d'écrire un plan d'implémentation.
- **Dépend de :** la *fondation* livrée par `docs/superpowers/plans/2026-05-23-activities-db-ingestion.md` (schéma BDD, domaine, `PromoteCandidateUseCase`, `ConfirmActivityUseCase`, adaptateurs Prisma, feed scopé par ville). Ce plan-2 **ne touche pas** à la BDD ni au domaine ; il les *expose*.
- **Spec d'origine :** `docs/superpowers/specs/2026-05-23-activities-db-ingestion-design.md` (§7 et §9 reportaient les MCP « en contrat seulement » — ce document reprend ce fil).

---

## 1. Objectif

Exposer les opérations d'ingestion et de re-vérification de la fondation comme **outils MCP** qu'un **agent orchestrateur**, lancé depuis Claude Code, peut appeler. L'agent fait la recherche web (via le **Tavily MCP**, externe) et le **jugement** ; notre serveur MCP ne fait que des opérations **déterministes** qui écrivent en base.

---

## 2. Modèle d'exécution (acté)

```
Toi (Claude Code) ──▶ Agent orchestrateur
                          │
                          ├─▶ Tavily MCP (externe)   ── recherche web + extraction
                          │
                          └─▶ NOTRE MCP ─▶ use cases ─▶ Prisma ─▶ Postgres
                                outils déterministes uniquement
```

- **Flux recherche/ingestion :** l'agent (par thème) cherche via Tavily → extrait un payload d'activité → appelle l'outil `ingestActivity` → le serveur stocke un `RawActivityCandidate` puis lance `PromoteCandidateUseCase` (validation + dédup + create/refresh).
- **Flux re-vérification (une passe) :** l'agent appelle `listActivitiesDueForRecheck(city)` → pour chaque activité, il **re-cherche via Tavily et juge** → il appelle `confirmActivity(id)` (rafraîchit `lastSeenAt`/`lastVerifiedAt`/`recheckAfter`) **ou** `archiveActivity(id)`. **La boucle et le jugement vivent dans l'agent**, pas dans notre code.

---

## 3. Décisions actées (issues du grilling)

1. **L'agent est le vérificateur.** La décision « activité encore valide ? » relève du jugement sur des données web bruitées → un LLM, pas un adaptateur déterministe. Conséquence : pas de `IActivityVerifier` ni de `RecheckActivitiesUseCase` (boucle en process) côté fondation.
2. **Le serveur MCP n'expose que du déterministe.** Recherche/extraction/jugement = agent + Tavily. Stockage/dédup/changement de statut/dates = nos outils.
3. **Sous-système séparé.** Le serveur MCP est un plan distinct de la fondation (chacun doit livrer un logiciel testable seul).
4. **Re-vérification en une passe, robuste aux interruptions.** `recheckAfter` est une échéance absolue ; une interruption laisse simplement un backlog repris au prochain run (cf. spec d'origine §6).

---

## 4. Outils MCP proposés (CONTRATS À BRAINSTORMER — non figés)

| Outil | Entrée (proposée) | Effet | Sortie (proposée) |
|---|---|---|---|
| `ingestActivity` | `citySlug`, `payload: ExtractedActivityPayload`, `meta: { agentName, searchQuery, sourceUrl, rawExcerpt, category }` | crée `RawActivityCandidate` → `PromoteCandidateUseCase` | `{ outcome: 'PROMOTED'｜'DUPLICATE'｜'REJECTED', activityId: string｜null, reason: string｜null }` |
| `listActivitiesDueForRecheck` | `citySlug`, `limit?` | `findDueForRecheck(cityId, now)` | `[{ id, title, kind, address, latitude, longitude, externalUrl, lastVerifiedAt }]` |
| `confirmActivity` | `activityId` | `ConfirmActivityUseCase` (refresh + recalcul `recheckAfter`) | `{ id, recheckAfter: string｜null }` |
| `archiveActivity` | `activityId`, `reason?` | `repo.archive(id)` (PUBLISHED → ARCHIVED) | `{ id, status: 'ARCHIVED' }` |

> Les types `ExtractedActivityPayload` et les use cases (`PromoteCandidateUseCase`, `ConfirmActivityUseCase`) viennent de la fondation. Le serveur MCP les **enveloppe** ; il ne réimplémente aucune règle métier.

---

## 5. Questions ouvertes à brainstormer (avant d'écrire le plan 2)

1. **Transport & connexion.** stdio vs HTTP ? Comment Claude Code se connecte (`.mcp.json` du projet, `settings.json`, commande de lancement) ? Quelle commande démarre le serveur (`tsx src/mcp/server.ts` ?) ?
2. **Emplacement du code.** Le repo est un seul Next app à la racine (`src/`). Le serveur MCP va-t-il dans `src/mcp/`, ou faut-il introduire un workspace pnpm (`apps/web` + `apps/mcp`) comme l'évoque `CLAUDE.md` §4 ? (Promotion en package = quand un 2e consommateur existe → c'est peut-être le moment.)
3. **Réutilisation de la connexion Prisma.** Le serveur MCP est un autre process : réutilise-t-il `src/shared/db/prisma.ts` (le singleton global) ou instancie-t-il son propre `PrismaClient` ? Variables d'env (`DATABASE_URL`) au lancement.
4. **Garde-fous / autorisation.** Faut-il un jeton (réutiliser `ADMIN_TOKEN` ?) ? Écriture autorisée seulement en dev pour le POC ?
5. **Batch.** Un outil `ingestActivities` (plusieurs payloads d'un coup) pour limiter les allers-retours agent ? Idem un `applyRecheck(decisions[])` ?
6. **Granularité du recheck.** `confirmActivity` + `archiveActivity` séparés (vision actée) vs un seul `applyRecheckDecision(id, exists: boolean)` ? Tradeoff lisibilité agent vs nombre d'outils.
7. **Catégories / thèmes.** Comment l'agent sait quels thèmes chercher : codé dans son prompt, ou un outil `getCategories` ? (Les catégories sont l'enum `ActivityCategory`.)
8. **Remontée d'erreurs.** Format de `reason` pour `REJECTED` (bbox, payload invalide) exploitable par l'agent pour se corriger.
9. **Observabilité.** Logs via `pino` (`src/shared/obs/logger.ts`) ? Trace par `searchQuery`/`agentName` (déjà stockés dans le staging) ?
10. **`now` injectable.** Les use cases prennent `now` ; le serveur le fournit (`new Date()`) ou l'agent peut-il l'overrider (tests/replay) ?

---

## 6. Hors périmètre

- La fondation (plan 1) : schéma, domaine, use cases, adaptateurs Prisma, feed.
- Le Tavily MCP (externe) et les prompts/définitions des agents par thème.
- Tout déclenchement automatique (cron) : ici c'est **toi** qui lances l'agent depuis Claude Code.
- Multi-ville réel, i18n, match flou de dédup (cf. spec d'origine §9).
