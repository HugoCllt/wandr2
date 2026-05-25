# Spec — Agents d'ingestion & re-vérification, MVP (plan-3)

- **Date :** 2026-05-23 (créée) · 2026-05-24 (étoffée — brainstorm + grill)
- **Statut :** SPEC ÉTOFFÉE — décisions ouvertes (§9) tranchées, prompts rédigés (§7). **Prête pour le plan d'implémentation.** Périmètre volontairement minimal (« ça tourne correctement », pas d'optimisation de prompts).
- **Dépend de :**
  - **plan-2** (`2026-05-23-ingestion-mcp-server`) : le serveur MCP `wandr-ingestion` et ses 4 outils déterministes (`ingestActivity`, `listActivitiesDueForRecheck`, `confirmActivity`, `archiveActivity`). **Les agents consomment ces outils ; ils n'écrivent jamais en base directement.**
  - La **fondation** (`2026-05-23-activities-db-ingestion`) : enum `ActivityCategory` (les 6 thèmes), `ExtractedActivityPayload`, bbox de la ville.
  - **Changement `imageUrl` nullable** (en cours, hors-prompt) : `imageUrl` passe de requis à optionnel dans le schéma Zod `ingestActivity`, `RawActivityCandidate`, `Activity`, `ActivityDTO`, Prisma + placeholder UI. **La description de l'outil `ingestActivity` (`ingestActivity.ts`) doit lister `imageUrl` parmi les champs optionnels**, sinon le scout — qui lit cette description comme contrat d'extraction — le croira requis. Les prompts de cette spec supposent ce changement livré.
- **But :** définir le MVP **complet et rédigé** des agents lancés depuis Claude Code qui (a) **cherchent + extraient** des activités sur le web et les **ingèrent** via le MCP, et (b) **re-vérifient** les activités dues et les **confirment/archivent**. Le jugement et la boucle vivent dans les agents ; les écritures déterministes vivent dans le MCP (design §3.1/§3.2).

---

## 1. Périmètre

**Dans le périmètre :**
- 2 **slash commands** (orchestrateurs, lancés par l'utilisateur) : `/wandr-ingest <citySlug>` et `/wandr-recheck <citySlug>`.
- 2 **définitions d'agents** Claude Code (sous-agents, dispatchés en parallèle) : `wandr-theme-scout` (ingestion, paramétré par thème) et `wandr-recheck-verifier` (recheck).
- Le câblage **least-privilege** des outils (WebSearch/WebFetch natifs + outils MCP namespacés).
- Les **prompts rédigés** des 4 acteurs (§7) : français, **XML wrappant du MD**, sections `role/goal/input/steps/guardrails/output`, **≤100 lignes**, inline (zéro skill/script).
- Les **deux flux** de bout en bout, avec la **règle de snapshot** du recheck appliquée par l'orchestrateur.

**Hors périmètre (MVP) :**
- Prompts optimisés (recall/précision), few-shot, tuning. *MVP = instructions claires, pas d'ingénierie de prompt.*
- Déclenchement automatique (cron/scheduling) : c'est **l'utilisateur** qui lance les commands.
- Multi-ville réel (POC mono-ville Montréal), i18n.
- Service de géocodage (les scouts estiment les coordonnées ; la bbox est large, cf. §9.4).
- Gestion fine du rate-limit/retries/backoff.
- Un éventuel 5ᵉ outil MCP `getCity` (→ tranché §9, pas au MVP).
- Persistance des trouvailles « droppées » (→ déféré `tbd.md`).

---

## 2. Décisions actées

| # | Décision | Raison |
|---|---|---|
| Source web | **WebSearch + WebFetch natifs de Claude Code.** Pas de Tavily MCP au MVP. | Zéro dépendance/clé externe à provisionner ; tourne immédiatement. Tavily reconsidéré seulement si l'extraction native est insuffisante (§9). |
| Déclenchement | **2 slash commands + sous-agents parallèles.** | Isolation par sous-agent (un thème qui échoue ne pollue pas le run), parallélisme, contexte propre. Conforme à « c'est toi qui lances l'agent ». |
| Orchestration en session principale | **Les orchestrateurs sont les slash commands elles-mêmes** (pas des agents dispatchés). | En Claude Code, **seule la session principale peut spawn des sous-agents** ; un sous-agent n'a pas l'outil de dispatch. L'orchestrateur qui spawn les scouts/verifiers doit donc vivre dans la command. |
| Nommage `lead-*` | **Règle pour le futur, non déclenchée ici.** Un *agent* qui spawn des sous-agents devra s'appeler `lead-*` (ex. `lead-recheck`). Au MVP, les orchestrateurs sont des **commands**, pas des agents → aucun fichier `lead-*`. | Cohérent avec la contrainte plateforme ci-dessus : il n'existe pas d'agent-orchestrateur à nommer. |
| Modèles | **Sonnet pour les orchestrateurs** (commands, via frontmatter `model:`) ; **Haiku pour les sous-agents** (scouts + verifiers). | Sonnet pour l'agrégation/le découpage ; Haiku pour la recherche web volumineuse. Le verifier reste Haiku : le garde-fou « dans le doute, confirme » rend l'archive (seule action quasi-destructive) prudent même sur petit modèle. |
| Forme des prompts | **FR ; balises XML wrappant du MD** ; sections `role/goal/input/steps/guardrails/output` ; **≤100 lignes** ; **inline** (pas de skill/resource/script). | Best practices Claude (structure XML claire) + §2 `CLAUDE.md` (simplicité). Le contrat d'extraction vit déjà dans la description de l'outil `ingestActivity`, pas besoin de skill dédié. |
| Agent unique paramétré | **Un seul `wandr-theme-scout`, dispatché 1×/thème** (6 thèmes), pas 6 définitions. | DRY ; mêmes capacités paramétrées par thème (philosophie `CLAUDE.md` §4). |
| Frontière d'écriture | **Les agents n'appellent QUE les 4 outils MCP** pour écrire ; jamais Prisma/DB. | Le déterminisme et les règles métier restent dans le MCP/fondation (design §3.2). |
| Résolution de la ville | **`citySlug` = argument de la command ; si absent, l'orchestrateur le demande à l'utilisateur (`AskUserQuestion`) avant tout dispatch.** Terme de recherche = slug dé-slugifié (tirets → espaces). **Aucune** table nom/bbox codée en dur. | Pas de hardcode ; l'utilisateur tranche la ville. La bbox est gérée par la boucle de feedback `REJECTED` du MCP (§6), pas pré-chargée. |
| Classification PLACE/EVENT | **Le scout cherche globalement puis auto-classe** chaque trouvaille en `PLACE` ou `EVENT`. | On ne s'interdit pas un événement clairement daté ; le `kind` reflète la réalité observée, pas une présomption de recherche. |
| Champ requis manquant | **1 recherche d'approfondissement** pour combler (ex. `dateStart` d'un EVENT, adresse) ; toujours manquant → **drop** (l'activité n'est pas ingérée, mais rapportée dans `dropped`). | Couvre les pages incomplètes sans inonder le MCP de `REJECTED` ; budget borné (1 recherche) pour ne pas faire boucler Haiku. |

---

## 3. Flux ingestion — `/wandr-ingest <citySlug>`

**Orchestrateur (`/wandr-ingest`, command Sonnet, session principale) :**
1. **S'assure d'avoir un `citySlug`** : pris en argument (`$1`) ; **si absent, le demande** (`AskUserQuestion`) avant tout dispatch. Dérive le **terme de recherche** en dé-slugifiant (`montreal` → `montreal`, `new-york` → `new york`) — aucune table codée en dur.
2. Dispatche **un `wandr-theme-scout` par thème** des 6 `ActivityCategory` (`SPORT, ROMANTIC, FOOD, CULTURE, OUTDOOR, NIGHTLIFE`), **en parallèle** (un seul message), en lui passant `{ citySlug, searchCity, theme }`.
3. **Agrège** les comptes-rendus en un rapport final (par thème : promoted / duplicate / rejected / **dropped** + raisons des rejets & drops).

**Chaque `wandr-theme-scout` (sous-agent Haiku, pour son thème) :**
1. **Cherche globalement** via `WebSearch` des activités plausibles du thème dans la ville (ex. « meilleurs <thème> à <ville> » + variantes) — sans présumer le type.
2. Pour chaque résultat prometteur, **`WebFetch`** la page et **extrait** un `ExtractedActivityPayload` (le scout lit la *description de l'outil* `ingestActivity` comme contrat d'extraction : champs requis vs optionnels, coords dans la ville, prix en cents, `payload.category` = catégorie réelle). **Auto-classe** `kind` (`PLACE`/`EVENT`) ; `imageUrl` = `og:image` si présent, sinon `null`.
3. **Champ requis manquant** (date d'un EVENT, adresse/localisation) → **1 recherche d'approfondissement** pour le combler ; toujours manquant → **drop** (note dans `dropped`, n'appelle pas l'outil).
4. Appelle **`mcp__wandr-ingestion__ingestActivity`** une fois par activité retenue, avec `meta = { agentName: "<thème>-scout", searchQuery, sourceUrl, rawExcerpt, category: <thème> }`. **Ne pré-filtre pas les doublons** (l'outil déduplique).
5. **Lit l'`outcome`** : `PROMOTED`/`DUPLICATE` → comptabilise ; `REJECTED` → lit `reason`, **corrige la donnée** (coords hors bbox, EVENT sans `dateStart`, etc.) et re-tente **une fois** (sinon → `rejected`) ; erreur d'outil (Zod) → corrige **la forme** de l'appel.
6. **Retourne** : `{ theme, promoted, duplicate, rejected: [{title, reason}], dropped: [{title, reason}] }`.

**Cible MVP :** ~5–10 activités plausibles par thème, en *best effort* (pas un quota dur).

---

## 4. Flux recheck — `/wandr-recheck <citySlug>`

**Orchestrateur (`/wandr-recheck`, command Sonnet, session principale) :**
1. Appelle **`mcp__wandr-ingestion__listActivitiesDueForRecheck({ citySlug })` UNE SEULE FOIS** et **fige le résultat (snapshot)**. ⚠️ **Ne jamais ré-appeler** `listActivitiesDueForRecheck` pendant le run : confirmer repousse les échéances, donc un nouvel appel chevaucherait/sauterait des items (plan-2 §4.3, design §3.7). *Cette règle est la responsabilité clé de l'orchestrateur.*
2. Snapshot **vide** → rapporte « rien à re-vérifier » et s'arrête.
3. **Découpe** les IDs en **lots disjoints de ~8** (un lot par `wandr-recheck-verifier`).
4. Dispatche les verifiers en parallèle, chacun avec son lot (chaque item porte `id, title, address, latitude, longitude, externalUrl, lastVerifiedAt`).
5. **Agrège** les comptes-rendus (confirmé / archivé + justification courte).

**Chaque `wandr-recheck-verifier` (sous-agent Haiku, pour son lot) :** pour chaque activité du lot :
1. **Re-cherche/juge** via `WebSearch`/`WebFetch` (à partir de `title` + `address` + `externalUrl`) : l'activité **existe-t-elle encore / est-elle toujours pertinente** ?
2. **Une seule décision** par activité et par run :
   - encore valide → **`mcp__wandr-ingestion__confirmActivity({ activityId })`** ;
   - fermée / disparue / non pertinente, **sur preuve web claire** → **`mcp__wandr-ingestion__archiveActivity({ activityId })`**.
3. **Retourne** : `{ activityId, decision: 'confirmed'|'archived', evidence }`.

**Validation MVP de la règle de snapshot :** un second `/wandr-recheck <citySlug>` lancé juste après ne doit **pas** re-proposer les activités confirmées (échéances repoussées).

---

## 5. Cartographie harness Claude Code

| Primitive | Fichier (MVP) | Modèle | Rôle |
|---|---|---|---|
| Slash command | `.claude/commands/wandr-ingest.md` | `sonnet` | Entrée + orchestrateur ingestion (dispatche les scouts, agrège). |
| Slash command | `.claude/commands/wandr-recheck.md` | `sonnet` | Entrée + orchestrateur recheck (snapshot, lots disjoints, agrège). |
| Agent | `.claude/agents/wandr-theme-scout.md` | `haiku` | Sous-agent ingestion paramétré par thème. |
| Agent | `.claude/agents/wandr-recheck-verifier.md` | `haiku` | Sous-agent recheck pour un lot. |

**Outils par acteur (least-privilege) :**

| Acteur | Outils autorisés |
|---|---|
| `/wandr-ingest` (orchestrateur) | `Agent` (dispatch), `AskUserQuestion` |
| `/wandr-recheck` (orchestrateur) | `Agent` (dispatch), `AskUserQuestion`, `mcp__wandr-ingestion__listActivitiesDueForRecheck` |
| `wandr-theme-scout` | `WebSearch`, `WebFetch`, `mcp__wandr-ingestion__ingestActivity` |
| `wandr-recheck-verifier` | `WebSearch`, `WebFetch`, `mcp__wandr-ingestion__confirmActivity`, `mcp__wandr-ingestion__archiveActivity` |

*Note nommage :* les outils du serveur `wandr-ingestion` sont exposés sous `mcp__wandr-ingestion__<tool>`.
*Note dispatch :* dans ce projet l'outil de dispatch est `Agent` (conforme à la spec) ; si le runtime cible le nomme `Task`, adapter `allowed-tools` en conséquence — **point à vérifier à l'implémentation**.

**Prérequis :** serveur `wandr-ingestion` (plan-2) enregistré dans `.mcp.json` et démarré (la DB doit répondre — fail-fast) ; **changement `imageUrl` nullable** livré (cf. en-tête). WebSearch/WebFetch sont natifs (aucun setup).

---

## 6. Contrats d'agents (résumé ; prompts rédigés en §7)

### `wandr-theme-scout`
- **Entrée :** `{ citySlug, searchCity, theme }` (`theme` = un `ActivityCategory`).
- **Fait :** §3 étapes 1–5.
- **Contrat de sortie :** `{ theme, promoted: number, duplicate: number, rejected: Array<{ title, reason }>, dropped: Array<{ title, reason }> }`.
- **Garde-fous MVP :** 1 recherche d'enrichissement max par activité (sinon drop) ; 1 re-tentative max par activité sur `REJECTED` ; coords best-effort (bbox validée côté MCP) ; `meta.category = theme`, `payload.category` = catégorie réelle observée ; `imageUrl` best-effort (`og:image` sinon `null`).

### `wandr-recheck-verifier`
- **Entrée :** lot d'items `{ id, title, address, latitude, longitude, externalUrl, lastVerifiedAt }`.
- **Fait :** §4 étapes 1–3.
- **Contrat de sortie :** `Array<{ activityId, decision: 'confirmed'|'archived', evidence: string }>`.
- **Garde-fous MVP :** exactement **une** décision par activité ; archive **uniquement** sur preuve web claire — dans le doute, **confirmer**.

---

## 7. Prompts rédigés

> Forme imposée : français, balises XML wrappant du MD, sections `role/goal/input/steps/guardrails/output`, ≤100 lignes, inline.

### 7.1 `.claude/commands/wandr-ingest.md`

```markdown
---
description: Cherche, extrait et ingère des activités web pour une ville (6 scouts thématiques parallèles).
argument-hint: <citySlug>
model: sonnet
allowed-tools: Agent, AskUserQuestion
---

<role>
Orchestrateur d'ingestion Wandr. Tu dispatches des scouts thématiques et tu agrèges leurs rapports — tu n'écris jamais en base et tu ne cherches pas le web toi-même.
</role>

<goal>
Peupler une ville en activités plausibles via 6 scouts (un par thème), puis produire un rapport agrégé.
</goal>

<input>
`$1` = citySlug (ex. `montreal`). **Absent → demande-le via AskUserQuestion avant tout dispatch.**
Dérive le terme de recherche en dé-slugifiant : `new-york` → `new york`. Aucune table ville/bbox codée en dur.
</input>

<steps>
1. Résous le `citySlug` et le terme de recherche `searchCity`.
2. Dispatche **en parallèle, dans un seul message**, 6 `wandr-theme-scout` — un par catégorie : SPORT, ROMANTIC, FOOD, CULTURE, OUTDOOR, NIGHTLIFE. Passe à chacun `{ citySlug, searchCity, theme }`.
3. Agrège les 6 sorties `{ theme, promoted, duplicate, rejected[], dropped[] }`.
</steps>

<guardrails>
- Tu n'écris jamais en DB ; seuls les scouts (via l'outil MCP) écrivent.
- Tu ne cherches/extrais rien toi-même : tout passe par les scouts.
- Un thème qui échoue n'interrompt pas les autres.
</guardrails>

<output>
Rapport markdown : tableau `thème | promoted | duplicate | rejected | dropped`, puis les listes des rejets et des drops `(thème, titre, raison)`, puis les totaux.
</output>
```

### 7.2 `.claude/agents/wandr-theme-scout.md`

```markdown
---
name: wandr-theme-scout
description: Scout d'ingestion Wandr. Dispatché par /wandr-ingest, une fois par thème, pour chercher, extraire et ingérer des activités.
model: haiku
tools: WebSearch, WebFetch, mcp__wandr-ingestion__ingestActivity
---

<role>
Chercheur web d'activités pour UN thème dans UNE ville.
</role>

<goal>
Trouver ~5–10 activités plausibles du thème, les extraire, et en ingérer chacune via l'outil MCP. Best-effort, pas de quota dur.
</goal>

<input>
`{ citySlug, searchCity, theme }` — `theme` est une des 6 ActivityCategory.
</input>

<steps>
1. `WebSearch` large : ex. « meilleurs <theme> à <searchCity> » (+ variantes). Ne présume pas le type.
2. Pour chaque résultat prometteur : `WebFetch` la page, puis extrais un payload. **Contrat d'extraction = la description de l'outil `ingestActivity`** (champs requis vs optionnels, coords dans la ville, prix en cents entiers, `payload.category` = catégorie réelle).
3. **Auto-classe** `kind` : `PLACE` (lieu permanent) ou `EVENT` (daté). `imageUrl` = `og:image` si présent, sinon `null`.
4. **Champ requis manquant** (date d'un EVENT, adresse/localisation) → fais **1 recherche d'approfondissement** pour le combler. Toujours manquant après ça → **drop** (note dans `dropped`, n'ingère pas).
5. Appelle `ingestActivity` **une fois par activité retenue**, `meta = { agentName: "<theme>-scout", searchQuery, sourceUrl, rawExcerpt, category: <theme> }`. Ne déduplique pas toi-même.
6. Lis l'`outcome` : `PROMOTED`/`DUPLICATE` → compte ; `REJECTED` → lis `reason`, corrige la **donnée** et re-tente **une seule fois** (sinon → `rejected`) ; erreur d'outil (Zod) → corrige la **forme** de l'appel.
</steps>

<guardrails>
- Tu n'écris jamais en DB ; seul `ingestActivity` écrit.
- 1 recherche d'enrichissement max par activité ; si l'info requise manque encore → drop.
- 1 re-tentative max par activité sur `REJECTED`.
- Coords best-effort ; la bbox est validée côté MCP.
- `meta.category` = ton thème ; `payload.category` = catégorie réelle.
</guardrails>

<output>
`{ theme, promoted: number, duplicate: number, rejected: Array<{ title, reason }>, dropped: Array<{ title, reason }> }`
</output>
```

### 7.3 `.claude/commands/wandr-recheck.md`

```markdown
---
description: Re-vérifie les PLACE dues d'une ville (snapshot → lots disjoints → verifiers parallèles).
argument-hint: <citySlug>
model: sonnet
allowed-tools: Agent, AskUserQuestion, mcp__wandr-ingestion__listActivitiesDueForRecheck
---

<role>
Orchestrateur de re-vérification Wandr. Tu figes le travail, tu le découpes, tu dispatches — tu ne décides jamais confirm/archive toi-même.
</role>

<goal>
Faire re-vérifier chaque PLACE due d'une ville par des verifiers parallèles, puis produire un rapport.
</goal>

<input>
`$1` = citySlug. **Absent → demande-le via AskUserQuestion.**
</input>

<steps>
1. Résous le `citySlug`.
2. Appelle `listActivitiesDueForRecheck({ citySlug })` **UNE SEULE FOIS** et **fige le résultat (snapshot)**. ⚠️ **Ne rappelle JAMAIS cet outil pendant le run** : confirmer repousse les échéances, un nouvel appel chevaucherait/sauterait des items.
3. Snapshot vide → rapporte « rien à re-vérifier » et arrête-toi.
4. Découpe les items en **lots disjoints de ~8** (chaque ID dans exactement un lot). Dispatche **en parallèle** un `wandr-recheck-verifier` par lot, avec ses items complets `{ id, title, address, latitude, longitude, externalUrl, lastVerifiedAt }`.
5. Agrège les décisions.
</steps>

<guardrails>
- Snapshot unique : un seul appel à `listActivitiesDueForRecheck`.
- Lots disjoints : aucun ID dans deux lots.
- Tu ne décides pas confirm/archive ; les verifiers décident.
</guardrails>

<output>
Rapport markdown : nb confirmé / nb archivé, puis la liste des archivés `(titre, preuve)`.
</output>
```

### 7.4 `.claude/agents/wandr-recheck-verifier.md`

```markdown
---
name: wandr-recheck-verifier
description: Verifier de recheck Wandr. Dispatché par /wandr-recheck sur un lot de PLACE, pour confirmer ou archiver chacune.
model: haiku
tools: WebSearch, WebFetch, mcp__wandr-ingestion__confirmActivity, mcp__wandr-ingestion__archiveActivity
---

<role>
Vérificateur web : pour un lot d'activités, juge si chacune existe encore / est toujours pertinente.
</role>

<goal>
Prendre exactement UNE décision (confirmer ou archiver) par activité du lot.
</goal>

<input>
Lot d'items `{ id, title, address, latitude, longitude, externalUrl, lastVerifiedAt }`.
</input>

<steps>
1. Pour chaque item : `WebSearch`/`WebFetch` à partir de `title` + `address` + `externalUrl`.
2. Encore valide → `confirmActivity({ activityId: id })`.
3. Fermé / disparu / non pertinent **sur preuve web claire** → `archiveActivity({ activityId: id })`.
</steps>

<guardrails>
- Exactement UNE décision par activité.
- Archive uniquement sur preuve web claire (fermeture, page morte). **Dans le doute → confirme.**
- Tu n'écris jamais en DB ; seuls confirm/archive écrivent.
</guardrails>

<output>
`Array<{ activityId, decision: 'confirmed' | 'archived', evidence: string }>`
</output>
```

---

## 8. Critères d'acceptation MVP

1. `/wandr-ingest montreal` s'exécute, dispatche 6 scouts, et **crée de nouvelles activités PUBLISHED** en base (vérifiable via le feed / la DB), avec un **rapport agrégé** promoted/duplicate/rejected/**dropped** par thème.
2. Ré-exécuter `/wandr-ingest montreal` produit surtout des **`DUPLICATE`** (la dédup du MCP fonctionne de bout en bout via les agents).
3. `/wandr-recheck montreal` **snapshot** les PLACE dues (cf. §10 pour rendre des items dus), dispatche des verifiers sur des **lots disjoints**, et chaque activité due reçoit **exactement une** décision confirm/archive.
4. Un **second** `/wandr-recheck montreal` juste après ne re-propose **pas** les activités confirmées (règle de snapshot validée au niveau flux).
5. Aucune corruption de protocole : les logs du serveur restent sur **stderr** (déjà garanti par plan-2).

---

## 9. Décisions ouvertes — tranchées

1. **`getCity(slug)` : PAS au MVP, pas de hardcode.** La ville vient de l'argument de command (ou est demandée à l'utilisateur), le terme de recherche est le slug dé-slugifié, et la validité des coordonnées repose sur la boucle `REJECTED` (bbox) du MCP. `getCity` redeviendra pertinent pour de meilleurs termes de recherche / coords au 1ᵉʳ essai / multi-ville → `tbd.md`.
2. **Volume cible par thème : best-effort ~5–10, pas de quota dur.**
3. **Lots recheck : ~8 IDs par verifier**, un lot par verifier, dispatch parallèle.
4. **Précision des coordonnées : best-effort** depuis adresse/web + boucle `REJECTED` (bbox Montréal large `45.40–45.71 / -73.98→-73.47`) ; pas de géocodage.
5. **Logique inline dans les commands/agents** (pas de skills/scripts réutilisables au MVP).
6. **Modèle des sous-agents : Haiku** pour les scouts **et** les verifiers (le garde-fou « dans le doute, confirme » sécurise l'archive). Sonnet pour les orchestrateurs (commands).

---

## 10. Préparation des données de test (recheck)

Juste après une ingestion, chaque PLACE reçoit `recheckAfter = now + 90j` (`RECHECK_INTERVAL_DAYS = 90`, `freshness.ts`) → `listActivitiesDueForRecheck` renvoie **vide** et `/wandr-recheck` n'a rien à faire. Pour démontrer les AC#3/#4 **sans attendre 90 jours** :

- **Antidater** `recheckAfter` sur quelques PLACE via un `UPDATE` SQL / petit script Prisma **ponctuel et temporaire**.
- Lancer `/wandr-recheck montreal`, valider AC#3 puis AC#4.
- **Supprimer l'échafaudage de test après validation** (conforme `CLAUDE.md` §3) : aucun script/SQL temporaire ne reste dans le repo.

C'est une préoccupation de test, **hors prompts** : les définitions d'agents/commands restent inchangées.

---

## 11. Hors-périmètre / déférés (→ `tbd.md`)

- **Tavily MCP** : remplacé par WebSearch/WebFetch natifs au MVP ; revisiter si l'extraction native plafonne.
- **Scheduling automatique** (cron) des runs d'ingestion/recheck.
- **`getCity` MCP / multi-ville** (cf. §9.1).
- **Optimisation des prompts** (recall/précision, few-shot) — c'est précisément le « non-MVP ».
- **Persister les trouvailles « droppées » pour audit** : nécessiterait un schéma de candidat *partiel* (un drop n'a pas les champs requis d'un `ExtractedActivityPayload`) — spéculatif, hors MVP §2.
- **Agent-orchestrateur `lead-*`** : si un orchestrateur devient un *agent* (et non une command), il devra s'appeler `lead-*` ; bloqué tant que Claude Code n'autorise pas un sous-agent à spawn ses propres sous-agents.
