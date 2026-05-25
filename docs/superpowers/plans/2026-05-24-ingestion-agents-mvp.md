# Ingestion & Recheck Agents (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author the 4 Claude Code harness files (2 slash commands + 2 sub-agent definitions) that search/extract/ingest activities and re-verify due activities, all writing exclusively through the existing `wandr-ingestion` MCP tools.

**Architecture:** Two user-launched **slash commands** act as orchestrators in the main session (only the main session may spawn sub-agents). `/wandr-ingest` dispatches one `wandr-theme-scout` per `ActivityCategory` (6 in parallel); `/wandr-recheck` snapshots the due list once, slices it into disjoint batches, and dispatches one `wandr-recheck-verifier` per batch. Judgment and the search loop live in the agents; all deterministic writes live in the MCP server (`ingestActivity`, `listActivitiesDueForRecheck`, `confirmActivity`, `archiveActivity`). The agents never touch Prisma/DB directly.

**Tech Stack:** Claude Code slash commands (`.claude/commands/*.md`) + sub-agents (`.claude/agents/*.md`), markdown-with-frontmatter; native `WebSearch`/`WebFetch`; the `wandr-ingestion` stdio MCP server (Node/tsx + Prisma). No new runtime code — these are prompt/config files. The only throwaway code is a temporary Prisma antedating script for recheck test data (§10 of the spec), deleted after validation.

**Source spec:** `docs/superpowers/specs/2026-05-23-ingestion-agents-mvp-spec.md` (prompts authored verbatim in §7; this plan transcribes them into files and validates the two flows).

---

## File Structure

| File | Responsibility | Model | Tools |
|---|---|---|---|
| `.claude/agents/wandr-theme-scout.md` | Sub-agent: for ONE theme in ONE city, search → extract → `ingestActivity`, report counts. | `haiku` | `WebSearch`, `WebFetch`, `mcp__wandr-ingestion__ingestActivity` |
| `.claude/commands/wandr-ingest.md` | Orchestrator command: resolve `citySlug`, dispatch 6 scouts in parallel, aggregate report. | `sonnet` | `<DISPATCH_TOOL>`, `AskUserQuestion` |
| `.claude/agents/wandr-recheck-verifier.md` | Sub-agent: for a batch of PLACEs, judge each via web → `confirmActivity` or `archiveActivity`. | `haiku` | `WebSearch`, `WebFetch`, `mcp__wandr-ingestion__confirmActivity`, `mcp__wandr-ingestion__archiveActivity` |
| `.claude/commands/wandr-recheck.md` | Orchestrator command: resolve `citySlug`, snapshot due list ONCE, split into disjoint ~8-id batches, dispatch verifiers, aggregate. | `sonnet` | `<DISPATCH_TOOL>`, `AskUserQuestion`, `mcp__wandr-ingestion__listActivitiesDueForRecheck` |
| `scripts/antedate-recheck.ts` | **TEMPORARY** — antedate `recheckAfter` on a few PLACEs so the recheck flow has work (§10). **Deleted in Task 8.** | — | — |

`<DISPATCH_TOOL>` is the sub-agent dispatch tool name, resolved in **Task 1** (`Agent` or `Task`). Use the confirmed name everywhere it appears.

**Why no unit tests:** these are agent prompts and harness config, not functions. The honest verification for the file tasks is **structural** (frontmatter valid, model correct, tools allow-listed, ≤100 lines) and for the flow tasks is **behavioral** (run the command, inspect the DB/feed). The plan adapts the RED→GREEN rhythm accordingly: the "failing check" is a structural grep that fails because the file is absent; the "passing check" re-runs it after the file is written.

**Shell note:** the working environment is Windows PowerShell. Verification commands below are given in PowerShell. `git` commands are shell-agnostic.

---

## Task 1: Verify prerequisites & resolve the dispatch-tool name

This task writes no files — it confirms the ground the four prompts stand on and resolves the one genuine open point (spec §5, line 109). Do not skip it; a wrong dispatch-tool name silently breaks orchestration.

**Files:**
- Inspect: `.mcp.json`, `src/mcp/tools/ingestActivity.ts`, `tbd.md`

- [ ] **Step 1: Confirm the MCP server is registered**

Run: `Get-Content .mcp.json`
Expected: a `wandr-ingestion` entry under `mcpServers` (launcher `cmd /c pnpm tsx --env-file=.env src/mcp/server.ts`).

- [ ] **Step 2: Confirm the MCP server starts and the DB answers (fail-fast)**

Run: `pnpm tsx --env-file=.env -e "import('./src/mcp/deps.ts').then(()=>console.log('deps OK')).catch(e=>{console.error(e);process.exit(1)})"`
Expected: prints `deps OK` (DB reachable). If it throws a connection error, start the database before continuing — the flows in Tasks 6–7 require it. (If this one-liner is awkward in your setup, instead run the MCP integration test: `pnpm vitest run src/mcp/mcp-tools.integration.test.ts` and expect PASS.)

- [ ] **Step 3: Confirm the `imageUrl`-nullable prerequisite is shipped**

Run: `Select-String -Path src/mcp/tools/ingestActivity.ts -Pattern "imageUrl"`
Expected: the tool **description** lists `imageUrl` among the optional fields (the line "Champs optionnels (omis ⇒ null) : imageUrl, ..."), and the Zod schema has `imageUrl: z.string().url().nullable().default(null)`. This is what the scout reads as its extraction contract — it must say optional. (Already confirmed shipped in `tbd.md` under Hardcoded → `PLACEHOLDER_IMAGE_URL`.)

- [ ] **Step 4: Resolve the dispatch-tool name `<DISPATCH_TOOL>`**

In a Claude Code session, determine the name of the tool that dispatches sub-agents. Default and recommended: **`Agent`** (matches the spec and this environment's tool set). If the installed Claude Code version exposes the sub-agent dispatcher as **`Task`** instead, use `Task`.
Quick check: run `/agents` (or consult the version's tool list / docs). Whichever name appears as the sub-agent launcher is `<DISPATCH_TOOL>`.
Record the choice — it goes into the `allowed-tools` of both command files (Tasks 3 and 5).

- [ ] **Step 5: No commit** (verification-only task).

---

## Task 2: Create the `wandr-theme-scout` sub-agent

**Files:**
- Create: `.claude/agents/wandr-theme-scout.md`

- [ ] **Step 1: Confirm the file does not yet exist (RED)**

Run: `Test-Path .claude/agents/wandr-theme-scout.md`
Expected: `False`.

- [ ] **Step 2: Write the agent file (verbatim from spec §7.2)**

Create `.claude/agents/wandr-theme-scout.md` with exactly this content:

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

- [ ] **Step 3: Verify structure (GREEN)**

Run:
```powershell
Test-Path .claude/agents/wandr-theme-scout.md
Select-String -Path .claude/agents/wandr-theme-scout.md -Pattern "^name: wandr-theme-scout$|^model: haiku$|mcp__wandr-ingestion__ingestActivity"
(Get-Content .claude/agents/wandr-theme-scout.md | Measure-Object -Line).Lines
```
Expected: `True`; the three frontmatter/tool lines match; line count ≤ 100. Confirm the `tools:` line lists exactly `WebSearch, WebFetch, mcp__wandr-ingestion__ingestActivity` (least-privilege — no other MCP tool, no DB).

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/wandr-theme-scout.md
git commit -m "feat(agents): add wandr-theme-scout ingestion sub-agent

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Create the `/wandr-ingest` orchestrator command

**Files:**
- Create: `.claude/commands/wandr-ingest.md`
- Depends on: Task 1 (`<DISPATCH_TOOL>`), Task 2 (the scout it dispatches).

- [ ] **Step 1: Confirm the file does not yet exist (RED)**

Run: `Test-Path .claude/commands/wandr-ingest.md`
Expected: `False`.

- [ ] **Step 2: Write the command file (verbatim from spec §7.1)**

Create `.claude/commands/wandr-ingest.md` with exactly this content. **In the `allowed-tools` line, use the `<DISPATCH_TOOL>` name resolved in Task 1** (shown here as `Agent`; replace with `Task` if Task 1 found that):

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

- [ ] **Step 3: Verify structure (GREEN)**

Run:
```powershell
Test-Path .claude/commands/wandr-ingest.md
Select-String -Path .claude/commands/wandr-ingest.md -Pattern "^model: sonnet$|^allowed-tools:|argument-hint"
(Get-Content .claude/commands/wandr-ingest.md | Measure-Object -Line).Lines
```
Expected: `True`; `model: sonnet`; `allowed-tools:` lists `<DISPATCH_TOOL>, AskUserQuestion` (and **no** MCP write tool — the orchestrator never writes); line count ≤ 100. Confirm the six categories in step 2 of the prompt read exactly `SPORT, ROMANTIC, FOOD, CULTURE, OUTDOOR, NIGHTLIFE` (matches `ActivityCategories` in `src/modules/activities/domain/Activity.ts`).

- [ ] **Step 4: Commit**

```bash
git add .claude/commands/wandr-ingest.md
git commit -m "feat(commands): add /wandr-ingest orchestrator

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Create the `wandr-recheck-verifier` sub-agent

**Files:**
- Create: `.claude/agents/wandr-recheck-verifier.md`

- [ ] **Step 1: Confirm the file does not yet exist (RED)**

Run: `Test-Path .claude/agents/wandr-recheck-verifier.md`
Expected: `False`.

- [ ] **Step 2: Write the agent file (verbatim from spec §7.4)**

Create `.claude/agents/wandr-recheck-verifier.md` with exactly this content:

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

- [ ] **Step 3: Verify structure (GREEN)**

Run:
```powershell
Test-Path .claude/agents/wandr-recheck-verifier.md
Select-String -Path .claude/agents/wandr-recheck-verifier.md -Pattern "^name: wandr-recheck-verifier$|^model: haiku$|confirmActivity|archiveActivity"
(Get-Content .claude/agents/wandr-recheck-verifier.md | Measure-Object -Line).Lines
```
Expected: `True`; frontmatter matches; the `tools:` line lists exactly `WebSearch, WebFetch, mcp__wandr-ingestion__confirmActivity, mcp__wandr-ingestion__archiveActivity` (no `ingestActivity`, no `listActivitiesDueForRecheck` — the verifier neither ingests nor lists); line count ≤ 100.

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/wandr-recheck-verifier.md
git commit -m "feat(agents): add wandr-recheck-verifier sub-agent

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: Create the `/wandr-recheck` orchestrator command

**Files:**
- Create: `.claude/commands/wandr-recheck.md`
- Depends on: Task 1 (`<DISPATCH_TOOL>`), Task 4 (the verifier it dispatches).

- [ ] **Step 1: Confirm the file does not yet exist (RED)**

Run: `Test-Path .claude/commands/wandr-recheck.md`
Expected: `False`.

- [ ] **Step 2: Write the command file (verbatim from spec §7.3)**

Create `.claude/commands/wandr-recheck.md` with exactly this content. **In `allowed-tools`, use the `<DISPATCH_TOOL>` name from Task 1** (shown as `Agent`):

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

- [ ] **Step 3: Verify structure (GREEN)**

Run:
```powershell
Test-Path .claude/commands/wandr-recheck.md
Select-String -Path .claude/commands/wandr-recheck.md -Pattern "^model: sonnet$|listActivitiesDueForRecheck|UNE SEULE FOIS"
(Get-Content .claude/commands/wandr-recheck.md | Measure-Object -Line).Lines
```
Expected: `True`; `model: sonnet`; `allowed-tools:` lists `<DISPATCH_TOOL>, AskUserQuestion, mcp__wandr-ingestion__listActivitiesDueForRecheck` (the list tool is the **only** MCP tool the orchestrator may call — it must not have confirm/archive); the snapshot-once guardrail text is present; line count ≤ 100.

- [ ] **Step 4: Commit**

```bash
git add .claude/commands/wandr-recheck.md
git commit -m "feat(commands): add /wandr-recheck orchestrator

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: Validate the ingestion flow end-to-end (AC#1, AC#2, AC#5)

Behavioral validation. Requires the MCP server reachable (Task 1) and the four files in place. Run this in a Claude Code session with the `wandr-ingestion` MCP server connected.

**Files:**
- Inspect only (DB / feed). No new files.

- [ ] **Step 1: Capture the PUBLISHED baseline for Montréal**

Run:
```powershell
pnpm tsx --env-file=.env -e "import('@prisma/client').then(async({PrismaClient})=>{const p=new PrismaClient();const c=await p.city.findUnique({where:{slug:'montreal'}});const n=await p.activity.count({where:{cityId:c.id,status:'PUBLISHED'}});console.log('PUBLISHED before:',n);await p.$disconnect();})"
```
Expected: prints a baseline count (e.g. the seeded count). Note it.

- [ ] **Step 2: Run the ingestion command**

In the Claude Code session: `/wandr-ingest montreal`
Expected: it resolves `citySlug=montreal` (no `AskUserQuestion`, since the arg is present), dispatches **6** `wandr-theme-scout` sub-agents in parallel, and prints an aggregated markdown report with a per-theme `promoted | duplicate | rejected | dropped` table plus reject/drop lists and totals.

- [ ] **Step 3: Verify new PUBLISHED activities were created (AC#1)**

Run the same count one-liner as Step 1.
Expected: PUBLISHED count is now **higher** than the baseline (best-effort ~5–10/theme; any net increase with a coherent report satisfies AC#1). Spot-check a couple of titles exist:
```powershell
pnpm tsx --env-file=.env -e "import('@prisma/client').then(async({PrismaClient})=>{const p=new PrismaClient();const c=await p.city.findUnique({where:{slug:'montreal'}});const a=await p.activity.findMany({where:{cityId:c.id,status:'PUBLISHED'},orderBy:{createdAt:'desc'},take:5,select:{title:true,category:true,kind:true}});console.log(a);await p.$disconnect();})"
```
Expected: recently created activities with real titles, a `category` in the 6 enum values, and `kind` ∈ {PLACE, EVENT}.

- [ ] **Step 4: Re-run to prove dedup works through the agents (AC#2)**

In the Claude Code session: `/wandr-ingest montreal` (again).
Expected: the aggregated report is now **dominated by `duplicate`** counts (the MCP `dedupeKey` matched existing rows); PUBLISHED count grows little or not at all versus the end of Step 3.

- [ ] **Step 5: Confirm no protocol corruption (AC#5)**

Both runs completed and the MCP tools returned structured outcomes (the reports rendered). Because the server logs to **stderr** (guaranteed by plan-2), a clean run with parsed tool results is the evidence AC#5 asks for. If any run had shown JSON-RPC parse errors, that would indicate stdout leakage — none expected.

- [ ] **Step 6: No commit** (validation-only; no files changed).

> If AC#1 fails (zero promoted across all themes), do **not** edit prompts blindly — invoke superpowers:systematic-debugging. Likely causes, in order: dispatch-tool name wrong (Task 1 — orchestrator couldn't spawn scouts), MCP server not connected in this session, or DB down.

---

## Task 7: Prepare recheck test data, validate the recheck flow (AC#3, AC#4)

After ingestion, every PLACE gets `recheckAfter = now + 90d`, so the due list is empty. Per spec §10, antedate a few PLACEs with a **temporary** script to exercise the flow, then validate snapshot behavior. The script is deleted in Task 8 (CLAUDE.md §3 — no test scaffolding left in the repo).

**Files:**
- Create (temporary): `scripts/antedate-recheck.ts`

- [ ] **Step 1: Write the temporary antedating script**

Create `scripts/antedate-recheck.ts` with exactly this content:

```typescript
// TEMPORARY test scaffold (spec §10) — antedates recheckAfter so /wandr-recheck has work.
// DELETE after AC#3/#4 are validated (CLAUDE.md §3). Not imported by anything.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const city = await prisma.city.findUnique({ where: { slug: 'montreal' } });
  if (!city) throw new Error('City "montreal" not found — run /wandr-ingest first.');

  const places = await prisma.activity.findMany({
    where: { cityId: city.id, kind: 'PLACE', status: 'PUBLISHED' },
    take: 12,
    select: { id: true, title: true },
  });

  const ids = places.map((p) => p.id);
  await prisma.activity.updateMany({
    where: { id: { in: ids } },
    data: { recheckAfter: new Date(0) },
  });

  console.log(`Antedated ${ids.length} PLACE(s) due for recheck:`);
  for (const p of places) console.log(` - ${p.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run the script to make PLACEs due**

Run: `pnpm tsx --env-file=.env scripts/antedate-recheck.ts`
Expected: prints `Antedated N PLACE(s) due for recheck:` with N ≥ 1 (ideally ~9–12 so batching into ~8 produces 2 disjoint batches) and their titles. If N is 0, ingestion (Task 6) produced no PLACEs — re-run ingestion first.

- [ ] **Step 3: Run the recheck command and validate snapshot + disjoint batches + one decision each (AC#3)**

In the Claude Code session: `/wandr-recheck montreal`
Expected:
- Calls `listActivitiesDueForRecheck({ citySlug: 'montreal' })` **exactly once** (snapshot).
- Splits the IDs into **disjoint** batches of ~8 (no ID in two batches) and dispatches one `wandr-recheck-verifier` per batch in parallel.
- Each due activity receives **exactly one** decision (`confirmed` or `archived`).
- Prints a report: confirmed count / archived count + the archived list with evidence.

Cross-check the count of decisions equals N from Step 2:
```powershell
pnpm tsx --env-file=.env -e "import('@prisma/client').then(async({PrismaClient})=>{const p=new PrismaClient();const c=await p.city.findUnique({where:{slug:'montreal'}});const due=await p.activity.count({where:{cityId:c.id,kind:'PLACE',recheckAfter:{lte:new Date()},status:'PUBLISHED'}});console.log('PUBLISHED PLACEs still due:',due);await p.$disconnect();})"
```
Expected: low/zero — confirmed activities had their `recheckAfter` pushed forward; archived ones left PUBLISHED. (A nonzero residue only if a verifier left items unjudged, which violates AC#3 — investigate.)

- [ ] **Step 4: Run recheck a second time to validate the snapshot rule (AC#4)**

In the Claude Code session: `/wandr-recheck montreal` (immediately again).
Expected: the snapshot is now **empty** for the confirmed activities (their deadlines were pushed ~90d out), so the command reports **"rien à re-vérifier"** (or only re-proposes any that were left genuinely still-due). The confirmed activities from Step 3 are **not** re-proposed — this is AC#4.

- [ ] **Step 5: No commit yet** (the script is throwaway and is removed in Task 8).

> If AC#4 re-proposes confirmed activities, the orchestrator likely re-called `listActivitiesDueForRecheck` mid-run or the verifier didn't confirm — re-read the snapshot guardrail in `wandr-recheck.md` and the verifier's "one decision" rule; debug via superpowers:systematic-debugging.

---

## Task 8: Remove the test scaffold, record deferrals, self-review

**Files:**
- Delete: `scripts/antedate-recheck.ts`
- Modify: `tbd.md`

- [ ] **Step 1: Delete the temporary script (CLAUDE.md §3)**

Run: `Remove-Item scripts/antedate-recheck.ts`
Then confirm: `Test-Path scripts/antedate-recheck.ts` → expected `False`. If `scripts/` is now empty and was created only for this, remove it too.

- [ ] **Step 2: Append the spec's deferrals to `tbd.md`**

Add these bullets to `tbd.md` under the existing `## Future changes` section (these mirror spec §11 — capture them so they're not silently forgotten):

```markdown
- **Tavily MCP for ingestion search.** MVP uses native WebSearch/WebFetch in `wandr-theme-scout`; revisit Tavily only if native extraction recall/precision plateaus. — `.claude/agents/wandr-theme-scout.md`, spec `2026-05-23-ingestion-agents-mvp-spec.md` §11.
- **Scheduling (cron) of ingestion/recheck runs.** MVP is user-launched slash commands only; no automatic trigger. — spec §11.
- **`getCity(slug)` MCP tool / real multi-city.** Scouts derive the search term by de-slugifying and rely on the MCP `REJECTED`/bbox loop for coord validity; a `getCity` tool would give better search terms + first-try coords once multi-city exists. — spec §9.1.
- **Persist "dropped" findings for audit.** A drop lacks the required fields of an `ExtractedActivityPayload`, so persisting it needs a partial-candidate schema — speculative, out of MVP. — spec §11.
- **`lead-*` orchestrator agent.** If an orchestrator ever becomes an *agent* (not a slash command) that spawns sub-agents, it must be named `lead-*`; blocked until Claude Code lets a sub-agent spawn its own sub-agents. — spec §2 (Nommage `lead-*`) / §11.
- **Prompt optimization (recall/precision, few-shot, tuning)** for scouts/verifiers — explicitly the non-MVP. — spec §11.
```

- [ ] **Step 3: Commit the cleanup + deferrals**

```bash
git add -A
git commit -m "chore(ingestion-agents): record deferrals, remove recheck test scaffold

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
The script was never committed (Task 7 left it uncommitted), so `git add -A` simply stages the `tbd.md` edit; deleting the untracked script in Step 1 already removed it from the tree. Confirm with `git status` that no `scripts/antedate-recheck.ts` appears.

- [ ] **Step 4: Final self-review against the spec**

Confirm each acceptance criterion (spec §8) has been demonstrated:
- AC#1 — `/wandr-ingest montreal` created new PUBLISHED activities + aggregated report (Task 6 Step 3). ✔
- AC#2 — re-run produced mostly `DUPLICATE` (Task 6 Step 4). ✔
- AC#3 — `/wandr-recheck montreal` snapshotted, dispatched disjoint batches, one decision each (Task 7 Step 3). ✔
- AC#4 — second `/wandr-recheck montreal` did not re-propose confirmed activities (Task 7 Step 4). ✔
- AC#5 — no protocol corruption; tool outcomes parsed cleanly (Task 6 Step 5). ✔

Confirm form contract (spec §7 header) on all 4 prompt files: French, XML-wrapping-MD, `role/goal/input/steps/guardrails/output` sections, ≤100 lines, inline (no skill/script). Confirm least-privilege `tools`/`allowed-tools` per the §5 table. Confirm no `lead-*` file was created (orchestrators are commands, not agents — spec §2).

---

## Notes for the executor

- **Do not "improve" the prompts** beyond the spec's verbatim text (CLAUDE.md §3, and the spec's "MVP = clear instructions, not prompt engineering"). The only intentional deviation is substituting the resolved `<DISPATCH_TOOL>` name in the two `allowed-tools` lines.
- **The agents write only through MCP tools.** If you ever find yourself adding a DB/Prisma tool to an agent's `tools:` line, stop — that violates the write-boundary decision (spec §2) and the layer DAG.
- **The recheck snapshot rule is the single most important orchestrator behavior.** `listActivitiesDueForRecheck` is called once per run and never again mid-run. The reason lives in the tool's own description and in the command's guardrails — don't weaken it.
