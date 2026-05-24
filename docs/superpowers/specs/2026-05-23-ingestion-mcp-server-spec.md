# Spec — Serveur MCP d'ingestion & re-vérification (plan-2)

- **Date :** 2026-05-23
- **Statut :** SPEC COMPLÈTE — les 4 questions ouvertes du design sont tranchées (§2). Prête pour le plan d'implémentation.
- **Dépend de :**
  - Le **design** `docs/superpowers/specs/2026-05-23-ingestion-mcp-server-design.md` — modèle d'exécution (§2), décisions actées 1–9 (§3), contrats d'outils & câblage réel (§4/§4.1), squelette agents MVP (§7), amendements fondation (§8). **Ne pas re-débattre ces acquis.**
  - La **fondation** livrée (`2026-05-23-activities-db-ingestion`) : domaine, use cases, adaptateurs Prisma, schéma. Ce plan **enveloppe** la fondation ; il ne réimplémente aucune règle métier.
- **But du document :** spécifier de bout en bout le serveur MCP qui expose les opérations déterministes d'ingestion/re-vérification comme outils appelables par un agent orchestrateur lancé depuis Claude Code.

---

## 1. Périmètre

**Dans le périmètre :** un serveur MCP (`wandr-ingestion`) exposant **4 outils déterministes** — `ingestActivity`, `listActivitiesDueForRecheck`, `confirmActivity`, `archiveActivity` — plus **2 amendements fondation** pré-requis (§5).

**Hors périmètre :** recherche/extraction/jugement web (agent + Tavily) ; le sweep `archiveExpiredEvents` (pré-requis fondation livré séparément, design §8) ; les prompts d'agents optimisés (un squelette MVP est dans le design §7) ; le split monorepo `apps/web` + `apps/mcp` (déféré → `tbd.md`).

---

## 2. Questions ouvertes — tranchées

| Q | Décision | Raison |
|---|---|---|
| **Q1 Transport** | **stdio**, enregistré dans `.mcp.json` du projet, lancé par `pnpm tsx src/mcp/server.ts`. | Process-local, pas de port, pas de surface réseau. Standard MCP local pour Claude Code. *Contrainte induite : les logs vont sur **stderr**, jamais stdout (réservé au JSON-RPC).* |
| **Q2 Emplacement** | **`src/mcp/`** dans l'app Next actuelle (pas de split monorepo). | YAGNI : réutilise domaine/application/infra/`prisma` en process, zéro frontière de package. Le split `apps/web`+`apps/mcp` est déféré (`tbd.md`). |
| **Q4 Autorisation** | **Aucun jeton.** | stdio = isolation par le process OS ; il n'y a pas de surface réseau à protéger. (Si un jour HTTP/distant → bearer token.) |
| **Q9 Observabilité** | **pino → stderr**, une ligne structurée par appel d'outil. | Réutilise pino ; trace par `agentName`/`searchQuery`/`sourceUrl` (déjà en staging). Débogable après coup. |
| **Q10 `now`** | Fourni par le serveur (`new Date()`) à chaque appel, **non surchargeable** par l'agent. | Déterminisme ; pas de besoin replay au POC. |

---

## 3. Architecture & emplacement

`src/mcp/` est une **nouvelle surface de livraison** (composition root), parallèle au `app/` de Next — **pas une nouvelle couche**.

```
src/mcp/
  server.ts        # bootstrap : transport stdio, logger, enregistrement des 4 outils, instanciation des repos (1×)
  logger.ts        # pino → stderr (PAS le logger stdout partagé)
  tools/
    ingestActivity.ts
    listActivitiesDueForRecheck.ts
    confirmActivity.ts
    archiveActivity.ts
```

**Principes :**
- Chaque outil est une **fonction handler pure** `(deps, parsedInput) → result` — sans dépendance au transport, donc testable unitairement directement (§7).
- Réutilise le singleton `src/shared/db/prisma.ts`. Instancie `PrismaActivityRepository` / `PrismaCandidateRepository` / `PrismaCityRepository` **une fois** au bootstrap, et les injecte dans les handlers.
- **N'importe PAS `src/shared/config/env.ts`** : ce module valide *tout* l'environnement à l'import et exige `ADMIN_TOKEN`/`SEED_*`. Le serveur MCP n'a besoin que de `DATABASE_URL` (lu par `PrismaClient` seul) et, optionnellement, `LOG_LEVEL`.
- Nouvelle dépendance : `@modelcontextprotocol/sdk`.

**Layering (vérifié dans `.dependency-cruiser.cjs`) :** aucune règle ne contraint `from: ^src/mcp`. L'interdiction `web → infra` ne vise que `^src/app`. Donc `src/mcp/` peut importer **use cases (application) ET adaptateurs (infra)** directement — exactement comme les route handlers `modules/*/web` le font déjà (cf. `adminActivityRoute.ts`). Aucune arête interdite introduite.
**Tâche dep-cruiser :** ajouter `^src/mcp/server.ts` à `pathNot` de la règle `no-orphans` (point d'entrée, sinon avertissement *warn*).

**`.mcp.json` (racine du projet) :**

```json
{
  "mcpServers": {
    "wandr-ingestion": {
      "command": "pnpm",
      "args": ["tsx", "src/mcp/server.ts"],
      "env": { "DATABASE_URL": "postgresql://..." }
    }
  }
}
```

---

## 4. Contrats des 4 outils

### 4.1 Validation à deux couches (épine dorsale du contrat d'erreur)

- **Couche A — frontière de l'outil (Zod) :** structurel (types, champs requis, appartenance aux enums, format URL/datetime). Échec → **erreur d'outil MCP** (`isError`) portant le message Zod → l'agent corrige *la forme de son appel*.
- **Couche B — domaine (dans les use cases) :** règles métier (bbox, EVENT exige `dateStart`, invariants de `createActivity`). Échec → **`outcome: 'REJECTED'` avec `reason`** dans la valeur de retour, **pas** une erreur → l'agent apprend que *sa donnée* est mauvaise, pas son appel.

> Conséquence sur `ingestActivity` : un payload mal **typé** (ex. `latitude` string) = erreur d'outil ; un payload bien typé mais **hors bbox** ou EVENT **sans `dateStart`** = `REJECTED` + `reason`.

### 4.2 Tableau des contrats

| Outil | Entrée (Zod) | Composition | Sortie |
|---|---|---|---|
| `ingestActivity` | `citySlug: string`, `payload: ExtractedActivityPayload`, `meta: { agentName, searchQuery, sourceUrl, rawExcerpt, category: ActivityCategory }` | résout `citySlug→cityId` (`cities.findBySlug`) → **inconnue : `{ outcome:'REJECTED', activityId:null, reason:'Unknown city: <slug>' }`, sans créer de candidat** ; `candidates.create({ cityId, category: meta.category, agentName, searchQuery, sourceUrl, rawExcerpt, extractedPayload: payload, dedupeKey:'placeholder' })` ; `PromoteCandidateUseCase.execute({ candidateId, now })` | `{ outcome:'PROMOTED'｜'DUPLICATE'｜'REJECTED', activityId: string｜null, reason: string｜null }` (verbatim du use case) |
| `listActivitiesDueForRecheck` | `citySlug: string`, `limit?: number (int>0)` | résout `citySlug→cityId` → **inconnue : erreur d'outil** (pas de contrat `outcome` ici) ; `ingestion.findDueForRecheck(cityId, now, limit)` (ordre `recheckAfter asc, id asc`) | `[{ id, title, kind, address, latitude, longitude, externalUrl, lastVerifiedAt: ISO }]` |
| `confirmActivity` | `activityId: string` | `ConfirmActivityUseCase.execute({ activityId, now })` → `{ recheckAfter }` | `{ id, recheckAfter: ISO｜null }` (introuvable → erreur d'outil) |
| `archiveActivity` | `activityId: string` | `ingestion.archive(activityId)` (PUBLISHED→ARCHIVED, **sans garde de statut** — conforme à l'adaptateur existant) | `{ id, status:'ARCHIVED' }` (id absent → Prisma P2025 → erreur d'outil) |

**Câblage `PromoteCandidateUseCase` :** le même repo joue deux rôles —
`new PromoteCandidateUseCase(activityRepo, activityRepo, candidateRepo, cityRepo)`
(`PrismaActivityRepository` implémente à la fois `IActivityRepository` et `IActivityIngestionRepository`).

**`meta.category` vs `payload.category` :** `meta.category` = thème de recherche de l'agent (stocké sur le candidat, traçabilité) ; `payload.category` = catégorie réelle écrite sur l'`Activity`. Ne jamais câbler `meta.category` dans l'activité (design §4.1).

### 4.3 Documentation des outils (texte exposé à l'agent)

Ces descriptions sont enregistrées comme `description` de chaque outil MCP et lues par l'orchestrateur / les sous-agents pour appeler correctement.

**`ingestActivity`**
> Enregistre **une** activité que tu as extraite du web pour une ville, puis la fait passer par validation + déduplication + création/rafraîchissement. Appelle-le **une fois par activité plausible trouvée** — **ne pré-filtre pas les doublons toi-même**, l'outil déduplique. Lis l'`outcome` pour savoir quoi rapporter.
> - `citySlug` — slug de la ville (ex. `"montreal"`). Ville inconnue → `REJECTED`.
> - `payload` — la donnée façon Activity que tu as extraite. `latitude`/`longitude` **doivent** tomber dans la ville ; un `kind:'EVENT'` **doit** avoir `dateStart` (ISO 8601) ; prix en **cents entiers** ; `payload.category` = la catégorie **réelle** de l'activité.
> - `meta` — provenance : `agentName` (ton nom), `searchQuery` (la requête qui l'a trouvée), `sourceUrl`, `rawExcerpt` (le texte d'où tu as extrait), `category` (**ton thème de recherche**, peut différer de `payload.category`).
> - **Outcomes :** `PROMOTED` = nouvelle activité créée ; `DUPLICATE` = a matché une existante (sa fraîcheur a été rafraîchie) ; `REJECTED` = la donnée a échoué une règle métier — lis `reason` et **corrige la donnée** (pas la forme de l'appel).

**`listActivitiesDueForRecheck`**
> Renvoie jusqu'à `limit` activités d'une ville dont l'échéance de re-vérification est passée, **échéance la plus ancienne d'abord**. Appelle-le **une seule fois** par run de recheck et **fige (snapshot) le résultat** ; ne le rappelle pas pendant que des sous-agents décident — confirmer repousse les échéances, donc un nouvel appel **chevaucherait ou sauterait** des items (design §3.7). Découpe toi-même les IDs renvoyés en lots disjoints.
> - `citySlug` — slug de la ville ; ville inconnue → erreur.
> - `limit?` — nombre max d'items (entier > 0) ; omis = toutes les activités dues.
> - **Retour :** `id`, `title`, `kind`, `address`, `latitude`, `longitude`, `externalUrl`, `lastVerifiedAt` — de quoi re-trouver chaque activité sur le web.

**`confirmActivity`**
> Enregistre qu'une activité **existe encore / est toujours pertinente** (tu l'as vérifié via le web). Rafraîchit ses timestamps de fraîcheur et repousse la prochaine échéance de recheck. **Exactement une** décision `confirmActivity`/`archiveActivity` par activité et par run.
> - `activityId` — un `id` issu de `listActivitiesDueForRecheck`.
> - **Retour :** `id`, `recheckAfter` (prochaine échéance ; `null` pour les EVENT).

**`archiveActivity`**
> Enregistre qu'une activité a **fermé / disparu / n'est plus pertinente**. Passe son statut `PUBLISHED → ARCHIVED` pour la sortir du feed. **Exactement une** décision `confirmActivity`/`archiveActivity` par activité et par run. N'archive que sur **preuve web claire**.
> - `activityId` — un `id` issu de `listActivitiesDueForRecheck`.
> - **Retour :** `id`, `status` (`'ARCHIVED'`).

---

## 5. Amendements fondation (inclus dans le plan-2)

| Amendement | Détail | Fichiers |
|---|---|---|
| `findDueForRecheck(cityId, now, limit?)` | Ajouter `limit?` optionnel au **port** + documenter l'ordre ; dans l'**adaptateur** ajouter `orderBy: [{ recheckAfter:'asc' }, { id:'asc' }]` et `take: limit`. Le filtre `recheckAfter: { lte: now }` exclut déjà les `null` → l'ordre `asc` est sûr. Le tiebreaker `id` est **obligatoire** (pagination stable, design §3.6). | `domain/IActivityIngestionRepository.ts`, `infra/PrismaActivityRepository.ts:197` |
| `ConfirmActivityUseCase.execute` → retourne `{ recheckAfter: Date｜null }` | Signature `Promise<void>` → `Promise<{ recheckAfter: Date｜null }>`. La valeur est **déjà calculée** à `ConfirmActivityUseCase.ts:31` — la capturer et la retourner. Mettre à jour le test pour l'asserter. | `application/ConfirmActivityUseCase.ts`, `.test.ts` |

> **Hors plan-2 :** le sweep `archiveExpiredEvents` (design §8) est un pré-requis fondation livré séparément.

---

## 6. Observabilité & bootstrap

- `src/mcp/logger.ts` : `pino({ level: process.env.LOG_LEVEL ?? 'info' }, pino.destination(2))` → **stderr**. Le logger stdout partagé n'est **pas** réutilisé (il corromprait le JSON-RPC).
- Une ligne structurée par appel :
  - `ingestActivity` → `{ tool, agentName, searchQuery, sourceUrl, outcome, activityId｜reason }` (`warn` si `REJECTED`).
  - `listActivitiesDueForRecheck` → `{ tool, citySlug, count, limit }`.
  - `confirmActivity` / `archiveActivity` → `{ tool, activityId, result }`.
- `server.ts` : `StdioServerTransport`, enregistre les 4 outils avec leurs schémas Zod, instancie le singleton `prisma` + les repos une fois, log par appel.

---

## 7. Tests

- **Unitaires (fakes en mémoire, réutilisant le pattern fake-repo de la fondation)** — chaque branche :
  - `ingestActivity` : `PROMOTED`, `DUPLICATE`, `REJECTED` (hors bbox), ville inconnue, entrée Zod invalide.
  - `listActivitiesDueForRecheck` : liste ordonnée + bornée par `limit` ; ville inconnue → erreur.
  - `confirmActivity` : retourne `{ id, recheckAfter }` ; introuvable → erreur.
  - `archiveActivity` : retourne `{ id, status }` ; introuvable → erreur.
- **Intégration (Postgres de test)** — les deux flux bout-en-bout :
  - cycle ingestion : `PROMOTED`, puis `DUPLICATE` à la ré-ingestion du même payload.
  - cycle recheck : `list → confirm/archive` ; confirmer repousse `recheckAfter`, donc un nouveau `list` **ne chevauche pas** — valide la règle de snapshot (§3.7) au niveau données.

---

## 8. Déférés (→ `tbd.md`)

- **Split monorepo `apps/web` + `apps/mcp`** : le MCP vit dans `src/mcp/` pour l'instant ; réconcilier le nommage `apps/web` de `CLAUDE.md` §4 quand une vraie 2ᵉ cible de déploiement existe.
- **`dedupeKey:'placeholder'`** posé par `ingestActivity` : la clé faisant autorité est recalculée dans `PromoteCandidateUseCase` (design §4.1).
- **Aucune autorisation** sur le MCP (stdio, isolation OS) : revisiter si HTTP/distant.
