# Spec — Agents d'ingestion & re-vérification, MVP (plan-3)

- **Date :** 2026-05-23
- **Statut :** SPEC MVP — prête à brainstormer avant le plan d'implémentation. Périmètre volontairement minimal (« ça tourne correctement », pas d'optimisation de prompts).
- **Dépend de :**
  - **plan-2** (`2026-05-23-ingestion-mcp-server`) : le serveur MCP `wandr-ingestion` et ses 4 outils déterministes (`ingestActivity`, `listActivitiesDueForRecheck`, `confirmActivity`, `archiveActivity`). **Les agents consomment ces outils ; ils n'écrivent jamais en base directement.**
  - La **fondation** (`2026-05-23-activities-db-ingestion`) : enum `ActivityCategory` (les 6 thèmes), `ExtractedActivityPayload`, bbox de la ville.
- **But :** définir le squelette MVP des agents lancés depuis Claude Code qui (a) **cherchent + extraient** des activités sur le web et les **ingèrent** via le MCP, et (b) **re-vérifient** les activités dues et les **confirment/archivent**. Le jugement et la boucle vivent dans les agents ; les écritures déterministes vivent dans le MCP (design §3.1/§3.2).

---

## 1. Périmètre

**Dans le périmètre :**
- 2 **slash commands** (orchestrateurs, lancés par l'utilisateur) : `/wandr-ingest <citySlug>` et `/wandr-recheck <citySlug>`.
- 2 **définitions d'agents** Claude Code (sous-agents, dispatchés en parallèle) : `wandr-theme-scout` (ingestion, paramétré par thème) et `wandr-recheck-verifier` (recheck).
- Le câblage **least-privilege** des outils (WebSearch/WebFetch natifs + outils MCP namespacés).
- Les **deux flux** de bout en bout, avec la **règle de snapshot** du recheck appliquée par l'orchestrateur.

**Hors périmètre (MVP) :**
- Prompts optimisés (recall/précision), few-shot, tuning. *MVP = instructions claires, pas d'ingénierie de prompt.*
- Déclenchement automatique (cron/scheduling) : c'est **l'utilisateur** qui lance les commands.
- Multi-ville réel (POC mono-ville Montréal), i18n.
- Service de géocodage (les scouts estiment les coordonnées ; la bbox est large, cf. §8).
- Gestion fine du rate-limit/retries/backoff.
- Un éventuel 5ᵉ outil MCP `getCity` (→ décision ouverte §8).

---

## 2. Décisions actées

| # | Décision | Raison |
|---|---|---|
| Source web | **WebSearch + WebFetch natifs de Claude Code.** Pas de Tavily MCP au MVP. | Zéro dépendance/clé externe à provisionner ; tourne immédiatement. Tavily reconsidéré seulement si l'extraction native est insuffisante (§8). |
| Déclenchement | **2 slash commands + sous-agents parallèles.** | Isolation par sous-agent (un thème qui échoue ne pollue pas le run), parallélisme, contexte propre. Conforme à « c'est toi qui lances l'agent ». |
| Agent unique paramétré | **Un seul `wandr-theme-scout`, dispatché 1×/thème** (6 thèmes), pas 6 définitions. | DRY ; mêmes capacités paramétrées par thème (philosophie `CLAUDE.md` §4). |
| Frontière d'écriture | **Les agents n'appellent QUE les 4 outils MCP** pour écrire ; jamais Prisma/DB. | Le déterminisme et les règles métier restent dans le MCP/fondation (design §3.2). |
| Résolution de la ville | **`citySlug` = argument de la command ; si absent, l'orchestrateur le demande à l'utilisateur (`AskUserQuestion`) avant tout dispatch.** Terme de recherche = slug dé-slugifié (tirets → espaces). **Aucune** table nom/bbox codée en dur. | Pas de hardcode ; l'utilisateur tranche la ville. La bbox est gérée par la boucle de feedback `REJECTED` du MCP (§6), pas pré-chargée. |

---

## 3. Flux ingestion — `/wandr-ingest <citySlug>`

**Orchestrateur (session principale, piloté par la command) :**
1. **S'assure d'avoir un `citySlug`** : pris en argument de la command ; **si absent, le demande à l'utilisateur** (`AskUserQuestion`) avant tout dispatch. Dérive le **terme de recherche** en dé-slugifiant (`montreal` → `montreal`, `new-york` → `new york`) — aucune table codée en dur.
2. Dispatche **un `wandr-theme-scout` par thème** des 6 `ActivityCategory` (`SPORT, ROMANTIC, FOOD, CULTURE, OUTDOOR, NIGHTLIFE`), **en parallèle** (skill `dispatching-parallel-agents`), en lui passant : `citySlug`, le cadre géo de la ville, et le `theme`.
3. **Agrège** les comptes-rendus des scouts en un rapport final (par thème : promoted / duplicate / rejected + raisons des rejets).

**Chaque `wandr-theme-scout` (sous-agent, pour son thème) :**
1. **Cherche** via `WebSearch` des activités plausibles du thème dans la ville (ex. requête « meilleurs <thème> à <ville> »).
2. Pour chaque résultat prometteur, **`WebFetch`** la page et **extrait** un `ExtractedActivityPayload` (le scout lit la *description de l'outil* `ingestActivity` — déjà rédigée en plan-2 §4.3 — comme contrat d'extraction : champs obligatoires vs optionnels, coords dans la ville, prix en cents, `payload.category` = catégorie réelle).
3. Appelle **`mcp__wandr-ingestion__ingestActivity`** une fois par activité plausible, avec `meta = { agentName: "<thème>-scout", searchQuery, sourceUrl, rawExcerpt, category: <thème> }`. **Ne pré-filtre pas les doublons** (l'outil déduplique).
4. **Lit l'`outcome`** : `PROMOTED`/`DUPLICATE` → comptabilise ; `REJECTED` → lit `reason`, **corrige la donnée** (coords hors bbox, EVENT sans `dateStart`, etc.) et peut re-tenter **une fois** ; erreur d'outil (Zod) → corrige **la forme** de l'appel.
5. **Retourne** un résumé structuré : `{ theme, promoted, duplicate, rejected: [{title, reason}] }`.

**Cible MVP :** ~5–10 activités plausibles par thème, en *best effort* (pas un quota dur).

---

## 4. Flux recheck — `/wandr-recheck <citySlug>`

**Orchestrateur (session principale) :**
1. Appelle **`mcp__wandr-ingestion__listActivitiesDueForRecheck({ citySlug })` UNE SEULE FOIS** et **fige le résultat (snapshot)**. ⚠️ **Ne jamais ré-appeler** `listActivitiesDueForRecheck` pendant le run : confirmer repousse les échéances, donc un nouvel appel chevaucherait/sauterait des items (plan-2 §4.3, design §3.7). *Cette règle est la responsabilité clé de l'orchestrateur.*
2. **Découpe** les IDs du snapshot en **lots disjoints** (un lot par `wandr-recheck-verifier`).
3. Dispatche les verifiers en parallèle, chacun avec son lot (chaque item porte `id, title, address, latitude, longitude, externalUrl, lastVerifiedAt`).
4. **Agrège** les comptes-rendus (confirmé / archivé + justification courte).

**Chaque `wandr-recheck-verifier` (sous-agent, pour son lot) :** pour chaque activité du lot :
1. **Re-cherche/juge** via `WebSearch`/`WebFetch` (à partir de `title` + `address` + `externalUrl`) : l'activité **existe-t-elle encore / est-elle toujours pertinente** ?
2. **Une seule décision** par activité et par run :
   - encore valide → **`mcp__wandr-ingestion__confirmActivity({ activityId })`** ;
   - fermée / disparue / non pertinente, **sur preuve web claire** → **`mcp__wandr-ingestion__archiveActivity({ activityId })`**.
3. **Retourne** : `{ activityId, decision: 'confirmed'|'archived', evidence }`.

**Validation MVP de la règle de snapshot :** un second `/wandr-recheck <citySlug>` lancé juste après ne doit **pas** re-proposer les activités confirmées (échéances repoussées).

---

## 5. Cartographie harness Claude Code

| Primitive | Fichier (MVP) | Rôle |
|---|---|---|
| Slash command | `.claude/commands/wandr-ingest.md` | Entrée + orchestrateur ingestion (dispatche les scouts, agrège). |
| Slash command | `.claude/commands/wandr-recheck.md` | Entrée + orchestrateur recheck (snapshot, lots disjoints, agrège). |
| Agent | `.claude/agents/wandr-theme-scout.md` | Sous-agent ingestion paramétré par thème. |
| Agent | `.claude/agents/wandr-recheck-verifier.md` | Sous-agent recheck pour un lot. |

**Outils par acteur (least-privilege) :**

| Acteur | Outils autorisés |
|---|---|
| Orchestrateur ingestion (command) | `Agent` (dispatch) uniquement |
| Orchestrateur recheck (command) | `Agent` (dispatch) + `mcp__wandr-ingestion__listActivitiesDueForRecheck` |
| `wandr-theme-scout` | `WebSearch`, `WebFetch`, `mcp__wandr-ingestion__ingestActivity` |
| `wandr-recheck-verifier` | `WebSearch`, `WebFetch`, `mcp__wandr-ingestion__confirmActivity`, `mcp__wandr-ingestion__archiveActivity` |

*Note nommage :* les outils du serveur `wandr-ingestion` sont exposés à Claude Code sous `mcp__wandr-ingestion__<tool>`.

**Prérequis :** serveur `wandr-ingestion` (plan-2) enregistré dans `.mcp.json` et démarré (la DB doit répondre — fail-fast). WebSearch/WebFetch sont natifs (aucun setup).

---

## 6. Définitions d'agents MVP (contrats, pas prompts finaux)

### `wandr-theme-scout`
- **Entrée (prompt de dispatch) :** `citySlug`, cadre géo de la ville (nom + zone), `theme` (un `ActivityCategory`).
- **Fait :** §3 étapes 1–4.
- **Contrat de sortie :** `{ theme, promoted: number, duplicate: number, rejected: Array<{ title, reason }> }`.
- **Garde-fous MVP :** une seule re-tentative par activité sur `REJECTED` ; produit des coordonnées best-effort depuis l'adresse/le web — la bbox de la ville est validée **côté MCP**, un `REJECTED` « outside bbox » déclenche une correction ; `meta.category = theme`, `payload.category` = catégorie réelle observée.

### `wandr-recheck-verifier`
- **Entrée (prompt de dispatch) :** lot d'items `{ id, title, address, latitude, longitude, externalUrl, lastVerifiedAt }`.
- **Fait :** §4 étapes 1–3.
- **Contrat de sortie :** `Array<{ activityId, decision: 'confirmed'|'archived', evidence: string }>`.
- **Garde-fous MVP :** exactement **une** décision par activité ; archive **uniquement** sur preuve web claire (fermeture, page morte, etc.) — dans le doute, **confirmer**.

---

## 7. Critères d'acceptation MVP

1. `/wandr-ingest montreal` s'exécute, dispatche 6 scouts, et **crée de nouvelles activités PUBLISHED** en base (vérifiable via le feed / la DB), avec un **rapport agrégé** promoted/duplicate/rejected par thème.
2. Ré-exécuter `/wandr-ingest montreal` produit surtout des **`DUPLICATE`** (la dédup du MCP fonctionne de bout en bout via les agents).
3. `/wandr-recheck montreal` **snapshot** les PLACE dues, dispatche des verifiers sur des **lots disjoints**, et chaque activité due reçoit **exactement une** décision confirm/archive.
4. Un **second** `/wandr-recheck montreal` juste après ne re-propose **pas** les activités confirmées (règle de snapshot validée au niveau flux).
5. Aucune corruption de protocole : les logs du serveur restent sur **stderr** (déjà garanti par plan-2).

---

## 8. Décisions ouvertes (à trancher au brainstorming du plan-3)

1. **`getCity(slug) → { name, center, bbox }` : tranché — PAS au MVP, pas de hardcode.** La ville vient de l'argument de command (ou est demandée à l'utilisateur), le terme de recherche est le slug dé-slugifié, et la validité des coordonnées repose sur la boucle `REJECTED` (bbox) du MCP — donc le cadre géo n'a pas besoin d'être pré-chargé. `getCity` redeviendra pertinent pour (a) de meilleurs termes de recherche, (b) des coords correctes au 1ᵉʳ essai, (c) le multi-ville → `tbd.md`.
2. **Volume cible par thème** (~5–10 ?) : quota souple vs best-effort libre.
3. **Taille des lots / nombre de verifiers** au recheck (ex. lots de 5–10 IDs).
4. **Précision des coordonnées** : à quel point les scouts géocodent-ils ? (bbox Montréal large : `45.40–45.71 / -73.98→-73.47` → tolérant pour le centre-ville ; acceptable au MVP, à surveiller.)
5. **Logique dans les commands (inline) vs skills réutilisables** : MVP recommandé = commands comme entrées + définitions d'agents dans `.claude/agents/` ; extraire en skills seulement si réutilisé.
6. **Modèle des sous-agents** (Haiku pour les scouts massifs vs Sonnet pour le jugement recheck ?) — knob coût/qualité.

---

## 9. Hors-périmètre / déférés (→ `tbd.md` au plan-3)

- **Tavily MCP** : remplacé par WebSearch/WebFetch natifs au MVP ; revisiter si l'extraction native plafonne.
- **Scheduling automatique** (cron) des runs d'ingestion/recheck.
- **`getCity` MCP / multi-ville** (cf. §8.1).
- **Optimisation des prompts** (recall/précision, few-shot) — c'est précisément le « non-MVP ».
