# Auth + Profile onboarding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Wandr from a hardcoded single-user POC (one seeded `User`, identified by `SEED_USER_EMAIL`) to a multi-user authenticated app, using **Better Auth** (email/password + Google OAuth) with native **DB sessions**, a **blocking onboarding popup** on first login, and replacing `MockProfileRepository` with a Prisma-backed reader. DAG from `CLAUDE.md` is strictly preserved at every slice.

**Architecture:** Better Auth occupies the HTTP auth edge (sign-up, sign-in, sign-out, session) at `/api/auth/[...all]`. Its config lives in `shared/auth/auth.ts`. The module `modules/auth/` is reduced to `web/` (client components only — no domain/application/infra wrappers). `cityId = Montréal` is injected on user creation via `databaseHooks.user.create.before`. The only domain use case introduced is `UpdateProfileUseCase` (profile, not auth). Onboarding is a blocking client popup mounted in `(with-sidebar)/layout.tsx`, gated by `onboardedAt === null`.

**Source spec:** `docs/superpowers/specs/2026-05-28-auth-profile-onboarding-spec.md` (copy of `SPEC.md` on branch `claude/user-auth-profile-13a0L`). The "Spec divergences" section below records 9 grilling-locked patches to that spec (notably: Better Auth replaces Auth.js v5, the auth module is collapsed, `passwordHash` lives on `Account` not `User`).

**Branch:** `claude/user-auth-profile-plan-EJIY9`.

---

## 1. Overview

Faire passer Wandr de POC mono-utilisateur (un seul `User` seedé) à app multi-utilisateurs authentifiés, via **Better Auth** (Google OAuth + email/password) avec **DB sessions natives**, popup d'onboarding bloquante à la 1ʳᵉ connexion, et `MockProfileRepository` remplacé par une lecture Prisma. DAG `CLAUDE.md` strictement respecté.

---

## 2. Divergences vs SPEC.md (résultats du grilling)

La SPEC reste l'historique du brainstorming. Les décisions ci-dessous **patchent** la SPEC ; elles ne la réécrivent pas (SPEC.md inchangée).

| # | Sujet SPEC | Patch | Pourquoi |
|---|---|---|---|
| P1 | Lib auth = Auth.js v5 (SPEC §2) | **Better Auth** | Auth.js v5 en security-patch only depuis Sept 2025 ; l'équipe Auth.js redirige vers Better Auth ([LogRocket 2026](https://blog.logrocket.com/best-auth-library-nextjs-2026/)). Better Auth ≠ Credentials/JWT conflict, DB sessions natives. |
| P2 | Module `modules/auth/{domain,application,infra}` complet (SPEC §4.1) | **modules/auth/ réduit à `web/`** (SignInForm, GoogleSignInButton, SignOutButton). Plus de port/adapter/use case côté auth. | CLAUDE.md §1 : "no abstractions for single-use code". Better Auth occupe l'edge HTTP auth (sign-up, sign-in, sign-out, sessions) ; wrapper ces flows en use cases = boilerplate sans valeur. Seul `UpdateProfileUseCase` (profile, pas auth) reste un vrai use case. |
| P3 | `passwordHash` sur `User` (SPEC §3.2) | `password` sur **`Account`** (`providerId='credential'`). Plus de champ `passwordHash` sur User. | Convention Better Auth (1 row Account par méthode d'auth). Plus propre, plus extensible (multi-provider sur même user). |
| P4 | Modèles `Account` / `Session` / `VerificationToken` (SPEC §3.1) | **`User` / `Account` / `Session` / `Verification`** au format Better Auth (`Session.token` au lieu de `sessionToken`, `Session.ipAddress`/`userAgent` ajoutés, `emailVerified: Boolean` au lieu de `DateTime?`, `Verification` au lieu de `VerificationToken`). Schéma généré via `npx @better-auth/cli generate` puis enrichi de nos relations métier. | Convention Better Auth. |
| P5 | `cityId` Montréal assigné via `events.createUser` Auth.js (SPEC §5.2) | **`databaseHooks.user.create.before`** Better Auth : intercepte la donnée avant insert Prisma et injecte `cityId = montrealId`. Fonctionne pour OAuth ET Credentials uniformément. | API Better Auth. Une seule mécanique pour les deux providers. |
| P6 | Seed user (Hugo) gardé tel quel (SPEC §3.2 note) | **Seed réécrit via `auth.api.signUpEmail()`** : Hugo est créé comme un user normal (User + Account credential avec password scrypt). Backfill `onboardedAt = now()` via update Prisma post-création. Variable `SEED_USER_PASSWORD` ajoutée à `env.ts`. | Single code-path d'inscription dans le repo. Hugo se logge immédiatement après `pnpm db:seed`. |
| P7 | Hash bcryptjs cost 10 (SPEC §2) | **scrypt** (default Better Auth) | Better Auth gère le hashing nativement. `bcryptjs` n'est pas ajouté aux deps. |
| P8 | `POST /api/auth/register` custom (SPEC §4.4) | **Supprimé** — Better Auth expose `POST /api/auth/sign-up/email` nativement via `[...all]/route.ts`. | Inutile. Better Auth handler couvre tout l'edge auth. |
| P9 | `next-auth.d.ts` module augmentation pour types session | **Supprimé** — Better Auth infère les types `session.user` automatiquement depuis la config (`additionalFields`). | API Better Auth. Zéro boilerplate types. |

**Risque R3 de l'ancien plan (Credentials force JWT) : RÉSOLU.** Better Auth fait DB sessions pour les deux providers, point.

---

## 3. Architecture decisions (finales)

- **Lib auth** : Better Auth (latest stable, pas beta).
- **Providers** : email/password + Google.
- **Sessions** : DB, table `Session`, logout serveur instantané.
- **Schéma Prisma** : convention Better Auth, généré par CLI puis enrichi.
- **Module auth** : `modules/auth/web/` uniquement (composants client). Config Better Auth dans `shared/auth/`.
- **Onboarding** : popup bloquante. `(with-sidebar)/layout.tsx` (server) fetch la session, redirect si non-auth, et passe `onboardedAt` en prop au `OnboardingGate` (client). Submit OK → `router.refresh()`.
- **Avatar fallback** : initiales CSS pures (premier caractère du `name`, background coloré dérivé du hash de l'email).
- **Tests** : unit-only sur `UpdateProfileUseCase` (seul use case restant). Validation manuelle aux checkpoints.

---

## 4. Dependency graph

```
[Phase 1] Schema Prisma + env vars
              │
              ▼
[Phase 2] Better Auth wiring
   • shared/auth/auth.ts (instance + databaseHooks cityId)
   • shared/auth/auth-client.ts
   • app/api/auth/[...all]/route.ts
   • shared/auth/current-user.ts (rewrite + NotAuthenticatedError → 401)
              │
              ▼
[Phase 3] Seed réécrit (via auth.api.signUpEmail)
              │
              ▼  ← CHECKPOINT 1 (auth backend functional)
              │
[Phase 4] Sign-in surface
   • (auth)/login page + layout
   • SignInForm (toggle Sign in / Create account) + GoogleSignInButton
              │
              ▼  ← CHECKPOINT 2 (signup + signin end-to-end)
              │
[Phase 5] Onboarding gate
   • (with-sidebar)/layout.tsx → fetch session, redirect, pass prop
   • ProfileFormModal (UI)
   • OnboardingGate (client, bloquant si onboardedAt === null)
              │
              ▼  ← CHECKPOINT 3 (new user forced through onboarding)
              │
[Phase 6] Profile read/write
   • PrismaProfileRepository (remplace Mock)
   • UpdateProfileUseCase + ProfileFormDTO + tests
   • PATCH /api/profile
   • Edit Profile (dismissable) + SignOutButton on ProfilePage
              │
              ▼  ← CHECKPOINT 4 (mock removed, edit + logout)
              │
[Phase 7] Polish — tbd.md cleanup, build green
```

---

## 5. Task list (17 tasks, vertically sliced)

### Phase 1 — Foundation: schema + env

#### Task 1 — Prisma schema (Better Auth shape) + nos extensions + migration

**Description :** Génère le squelette Better Auth (User/Account/Session/Verification) via `npx @better-auth/cli generate` puis main-ajuste pour :
- Étendre `User` avec : `cityId` (NOT NULL, FK City), `gender? Gender`, `birthDate? Date`, `bio?`, `onboardedAt?`.
- Conserver les relations existantes `affinities`, `favorites`, `calendarEntries`.
- Garder `Gender` enum, `City`, `UserCategoryAffinity`, `Favorite`, `CalendarEntry`, `Activity`, `Source`, etc. (inchangés).

Génère la migration `add_better_auth_tables_and_user_profile_fields`. **Pas de backfill SQL** : le seed user sera nuke+re-create via `pnpm db:seed` (Phase 3). Migration nuke uniquement les colonnes obsolètes si présentes (rien à supprimer ici — pas de `passwordHash` ni rien avant migration).

**Acceptance criteria :**
- [ ] `schema.prisma` : 4 modèles Better Auth (User étendu, Account, Session, Verification) + tous nos modèles métier intacts.
- [ ] `cityId` reste NOT NULL ; `gender`/`birthDate` nullables.
- [ ] `pnpm prisma:validate` passe.
- [ ] Migration applique sur DB fraîche sans erreur.

**Verification :**
- [ ] `pnpm type-check && pnpm dep:check` vert (test sera vert seulement après Task 3 qui rétablit l'import de prisma client typé).
- [ ] Inspection schéma : pas de champ `passwordHash` sur User.

**Dependencies :** None.

**Files touched :**
- `prisma/schema.prisma`
- `prisma/migrations/<ts>_add_better_auth_tables_and_user_profile_fields/migration.sql`

**Scope :** S.

---

#### Task 2 — Env vars : Better Auth + Google + SEED_USER_PASSWORD

**Description :** Étend `src/shared/config/env.ts` (Zod) avec :
- `BETTER_AUTH_SECRET` (min 32 char)
- `BETTER_AUTH_URL` (URL, ex: `http://localhost:3000`)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (strings, **optional** — fallback string vide ; on log un warning si vide, Google provider non monté si manquant — voir Task 3)
- `SEED_USER_PASSWORD` (min 8 char, default `'changeme123'` en dev pour zéro friction)

Crée `.env.example` avec les 5 vars (sans valeurs). Vérifie `.gitignore` ignore `.env.local`.

**Acceptance criteria :**
- [ ] `env.ts` valide les vars au boot.
- [ ] `.env.example` à jour.
- [ ] `pnpm dev` boot sans erreur avec un `.env.local` rempli (`GOOGLE_*` peuvent rester vides).

**Verification :**
- [ ] `pnpm type-check` vert.

**Dependencies :** None (parallèle à Task 1).

**Files touched :**
- `src/shared/config/env.ts`
- `.env.example`

**Scope :** XS.

---

### Phase 2 — Better Auth wiring

#### Task 3 — `shared/auth/auth.ts` : Better Auth instance + databaseHooks cityId

**Description :** Installe `better-auth` + `@better-auth/cli` (devDep). Crée `shared/auth/auth.ts` qui exporte `auth` :

```ts
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../db/prisma';
import { env } from '../config/env';

const googleConfigured = !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  socialProviders: googleConfigured
    ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
    : {},
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const montreal = await prisma.city.findUnique({ where: { slug: 'montreal' } });
          if (!montreal) throw new Error('Montreal city missing — seed first');
          return { data: { ...user, cityId: montreal.id } };
        },
      },
    },
  },
});
```

**Note conformité DAG :** ce fichier vit dans `shared/auth/` (couche de config cross-cutting, autorisée à toucher Prisma — comme `shared/db/`). Aucun module n'importe ce fichier sauf via la façade `shared/auth/current-user.ts` (Task 6) ; les routes API n'importent `auth` que dans `app/api/auth/[...all]/route.ts` (Task 5).

**Acceptance criteria :**
- [ ] `auth` exporté.
- [ ] `databaseHooks.user.create.before` injecte `cityId` Montréal (testé manuellement via signup en Phase 4).
- [ ] Si `GOOGLE_*` vides, Google provider non monté (pas de crash).
- [ ] `pnpm dep:check` vert.

**Verification :**
- [ ] `pnpm type-check && pnpm dep:check` vert.

**Dependencies :** Task 1, Task 2.

**Files touched :**
- `src/shared/auth/auth.ts`
- `package.json` (ajout `better-auth`, `@better-auth/cli`)

**Scope :** M.

---

#### Task 4 — `shared/auth/auth-client.ts` : Better Auth React client

**Description :** Crée le client Better Auth utilisé par les composants `'use client'` :

```ts
'use client';
import { createAuthClient } from 'better-auth/react';
export const authClient = createAuthClient({ baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL });
export const { signIn, signUp, signOut, useSession } = authClient;
```

Ajoute `NEXT_PUBLIC_BETTER_AUTH_URL` à `env.ts` (Task 2 patch) — visible côté client.

**Acceptance criteria :**
- [ ] Exporte `authClient`, `signIn`, `signUp`, `signOut`, `useSession`.
- [ ] `'use client'` directive présente.

**Verification :**
- [ ] `pnpm type-check && pnpm dep:check` vert.

**Dependencies :** Task 3.

**Files touched :**
- `src/shared/auth/auth-client.ts`
- `src/shared/config/env.ts` (ajout `NEXT_PUBLIC_BETTER_AUTH_URL`)

**Scope :** XS.

---

#### Task 5 — `app/api/auth/[...all]/route.ts` (Better Auth handler)

**Description :** Une ligne :
```ts
import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '../../../../shared/auth/auth';
export const { GET, POST } = toNextJsHandler(auth.handler);
```

Ne pas wrapper avec `withRoute` (Better Auth gère ses propres erreurs HTTP).

**Acceptance criteria :**
- [ ] `GET /api/auth/session` renvoie `null` (ou shape Better Auth équivalente) non-authentifié.
- [ ] `pnpm build` reconnaît la route.

**Verification :**
- [ ] Manuel : `curl http://localhost:3000/api/auth/get-session` retourne 200 + body cohérent.

**Dependencies :** Task 3.

**Files touched :**
- `src/app/api/auth/[...all]/route.ts`

**Scope :** XS.

---

#### Task 6 — Rewrite `shared/auth/current-user.ts` + audit 10 consommateurs

**Description :** Remplace l'implémentation :

```ts
import { headers } from 'next/headers';
import { auth } from './auth';
import { prisma } from '../db/prisma';

export class NotAuthenticatedError extends Error {}

export type CurrentUser = { id: string; email: string; name: string; cityId: string; onboardedAt: Date | null };

export async function getCurrentUser(): Promise<CurrentUser> {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session?.user) throw new NotAuthenticatedError();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, cityId: true, onboardedAt: true },
  });
  if (!user) throw new NotAuthenticatedError();
  return user;
}
```

Mappe `NotAuthenticatedError` → 401 dans `handleApiError`. Plus de `let cached`, plus de `SEED_USER_EMAIL`.

**Audit obligatoire** : les 10 sites de `getCurrentUser` (`favorites`, `feed`, `chat`, `calendar`, `profile`) — vérifier rien ne casse, tous retournent 401 propre côté API si non-authentifié.

**Acceptance criteria :**
- [ ] `current-user.ts` n'importe plus `SEED_USER_EMAIL`.
- [ ] `NotAuthenticatedError` → 401 dans `handleApiError`.
- [ ] Les 10 consommateurs compilent.

**Verification :**
- [ ] `pnpm type-check && pnpm dep:check && pnpm test` vert.
- [ ] Manuel : `curl http://localhost:3000/api/feed` non-auth → 401.

**Dependencies :** Task 3.

**Files touched :**
- `src/shared/auth/current-user.ts`
- `src/app/api/_lib/error-handler.ts`

**Scope :** S.

---

### Phase 3 — Seed update

#### Task 7 — Réécrit `prisma/seed.ts` (signup via Better Auth + post-update)

**Description :**
1. Avant le seed du user : `prisma.user.deleteMany({ where: { email: env.SEED_USER_EMAIL } })` (cascade nuke des Account/Session existants).
2. Signup via Better Auth API server-side :
   ```ts
   await auth.api.signUpEmail({ body: { email: SEED_USER_EMAIL, password: SEED_USER_PASSWORD, name: SEED_USER_NAME } });
   ```
   (databaseHooks injecte `cityId` Montréal automatiquement.)
3. Update Prisma direct pour les champs métier :
   ```ts
   await prisma.user.update({
     where: { email: SEED_USER_EMAIL },
     data: { gender: 'MALE', birthDate: new Date('2000-06-28'), onboardedAt: new Date() },
   });
   ```
4. Seed `UserCategoryAffinity` comme avant (inchangé).

**Acceptance criteria :**
- [ ] `pnpm db:seed` idempotent (re-run OK car deleteMany en amont).
- [ ] Après seed : Hugo a 1 row `User`, 1 row `Account` (providerId='credential', password scrypt), `onboardedAt` non-null, affinities seedées.
- [ ] Manuel : se logger avec `SEED_USER_EMAIL` + `SEED_USER_PASSWORD` → session active.

**Verification :**
- [ ] `pnpm db:seed` deux fois de suite → OK.
- [ ] DB inspection : Account row existe.

**Dependencies :** Task 3.

**Files touched :**
- `prisma/seed.ts`

**Scope :** S.

---

### Checkpoint 1 — Auth backend functional (after Task 7)

- [ ] `pnpm type-check && pnpm dep:check && pnpm test && pnpm build` vert.
- [ ] `GET /api/auth/get-session` non-auth → 200 avec `null`.
- [ ] Routes existantes (`/api/feed`, `/api/favorites`, …) → 401 non-auth.
- [ ] Seed user re-créé proprement, loggable manuellement via `curl POST /api/auth/sign-in/email`.
- [ ] **Pause + review utilisateur.**

---

### Phase 4 — Sign-in surface

#### Task 8 — `(auth)` layout + `app/(auth)/login/page.tsx`

**Description :** Crée le route group `(auth)` :
- `app/(auth)/layout.tsx` : minimal (pas de sidebar/edge-art).
- `app/(auth)/login/page.tsx` (server) : si `auth.api.getSession(...)` retourne une session, redirect `/`. Sinon rend `<SignInForm />` + `<GoogleSignInButton />`.

**Acceptance criteria :**
- [ ] `/login` charge sans crash.
- [ ] Session active → redirect `/`.

**Verification :**
- [ ] Manuel : navigation `/login`.
- [ ] `pnpm dep:check` vert.

**Dependencies :** Task 6.

**Files touched :**
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`

**Scope :** S.

---

#### Task 9 — `SignInForm` (toggle) + `GoogleSignInButton`

**Description :** Composants `'use client'` dans `modules/auth/web/`.

`SignInForm` : un state `mode: 'signin' | 'signup'` switch via toggle (texte "Don't have an account? Create one" / "Already have an account? Sign in"). Champs : email, password, name (uniquement si signup). Submit :
- mode 'signin' → `signIn.email({ email, password })` → redirect `/` au succès, erreur claire (toast / inline) si échec.
- mode 'signup' → `signUp.email({ email, password, name })` → Better Auth crée User + Account + Session automatiquement → redirect `/` (databaseHooks injecte cityId Montréal, OnboardingGate prendra le relai en Phase 5).

`GoogleSignInButton` : `signIn.social({ provider: 'google' })`. Si Google non configuré (`GOOGLE_*` vides), bouton disabled + tooltip "Google sign-in disabled in this env".

**Acceptance criteria :**
- [ ] Deux composants `'use client'`.
- [ ] Toggle Sign in / Create account fonctionnel.
- [ ] Erreurs Better Auth affichées clairement.
- [ ] Bouton Google disabled si `GOOGLE_*` vides (props passé par page server).

**Verification :**
- [ ] Manuel : signup → user + account créés en DB, redirect `/`.
- [ ] Manuel : signin avec mauvais password → message clair.

**Dependencies :** Task 4, Task 8.

**Files touched :**
- `src/modules/auth/web/SignInForm.tsx`
- `src/modules/auth/web/GoogleSignInButton.tsx`

**Scope :** M.

---

### Checkpoint 2 — Auth flow end-to-end (after Task 9)

- [ ] Manuel : Signup credentials → User + Account créés, session active, redirect `/`.
- [ ] Manuel : Signin credentials → session active.
- [ ] Manuel **conditionnel** : Signin Google (si clés OAuth configurées) → User créé avec `cityId` Montréal.
- [ ] `pnpm type-check && pnpm dep:check && pnpm test && pnpm build` vert.
- [ ] **Pause + review utilisateur.**

---

### Phase 5 — Onboarding gate

#### Task 10 — `(with-sidebar)/layout.tsx` : fetch session + redirect + prop

**Description :** Étend `src/app/(with-sidebar)/layout.tsx` (server) :

```ts
const session = await auth.api.getSession({ headers: headers() });
if (!session) redirect('/login');
const onboardedAt = await prisma.user.findUnique({
  where: { id: session.user.id }, select: { onboardedAt: true }
}).then(u => u?.onboardedAt ?? null);

return (
  <>
    {/* ... edge art, TopFilters ... */}
    <OnboardingGate onboardedAt={onboardedAt} />
    <main>{children}</main>
  </>
);
```

(Note : `onboardedAt` peut alternativement venir directement de `session.user` si on l'ajoute via `additionalFields` Better Auth — à arbitrer à l'implémentation, équivalent.)

**Acceptance criteria :**
- [ ] `/`, `/sport`, `/profile` → redirect `/login` si non-auth.
- [ ] Sinon, `OnboardingGate` rendu avec prop.

**Verification :**
- [ ] Manuel : non-auth → `/` redirige `/login`.
- [ ] `pnpm dep:check` vert.

**Dependencies :** Task 6.

**Files touched :**
- `src/app/(with-sidebar)/layout.tsx`

**Scope :** S.

---

#### Task 11 — `ProfileFormModal` (UI, agnostique du mode bloquant)

**Description :** Composant `'use client'` dans `modules/profile/web/`. Réutilise le pattern visuel de la modale d'activité (à identifier dans `modules/activities/web/`). Props : `initial: ProfileFormDTO`, `dismissable: boolean`, `onSubmit: (form) => Promise<void>`.

Champs :
- `birthDate` (date input, requis)
- `gender` (radio MALE/FEMALE/OTHER, requis)
- `cityId` (select, défaut Montréal — placeholder pour multi-cities futur)
- `bio` (textarea, max 280, optionnel)
- 6 sliders 0–10 (SPORT, FOOD, CULTURE, OUTDOOR, NIGHTLIFE, ROMANTIC)

Si `dismissable === false` : aucun close (pas de X, pas d'ESC, pas de overlay-click-close). Toast erreur sur submit failure, garde la modale ouverte.

**Acceptance criteria :**
- [ ] `'use client'`.
- [ ] Pas de `fetch('/api/profile')` direct — délégation à prop `onSubmit`.
- [ ] Validation côté client : birthDate + gender requis.
- [ ] Mode bloquant respecté.

**Verification :**
- [ ] Manuel sur page de test.
- [ ] `pnpm dep:check` vert.

**Dependencies :** Task 1 (types).

**Files touched :**
- `src/modules/profile/web/ProfileFormModal.tsx`
- `src/shared/contracts/ProfileFormDTO.ts` (stub minimal — finalisé en Task 14)

**Scope :** M.

---

#### Task 12 — `OnboardingGate` (client)

**Description :** Composant `'use client'` dans `modules/profile/web/` :

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { ProfileFormModal } from './ProfileFormModal';

export function OnboardingGate({ onboardedAt }: { onboardedAt: Date | null }) {
  const router = useRouter();
  if (onboardedAt !== null) return null;
  const onSubmit = async (form) => {
    const res = await fetch('/api/profile', { method: 'PATCH', body: JSON.stringify(form) });
    if (!res.ok) throw new Error('save failed');
    router.refresh();
  };
  return <ProfileFormModal initial={defaults} dismissable={false} onSubmit={onSubmit} />;
}
```

(Note : tant que Task 15 — PATCH route — n'est pas fait, `onSubmit` peut être stub qui throw. Le rendu doit déjà être visuellement validé.)

**Acceptance criteria :**
- [ ] Mount sans crash.
- [ ] Popup visible si `onboardedAt === null`, absente sinon.
- [ ] Aucun import Prisma.

**Verification :**
- [ ] Manuel : nouveau user signup → popup. Seed user → pas de popup.

**Dependencies :** Task 10, Task 11.

**Files touched :**
- `src/modules/profile/web/OnboardingGate.tsx`

**Scope :** S.

---

### Checkpoint 3 — Onboarding gate (after Task 12)

- [ ] Manuel : nouveau user signup → popup bloquante.
- [ ] Manuel : seed user → pas de popup.
- [ ] `pnpm type-check && pnpm dep:check && pnpm test` vert.
- [ ] **Pause + review utilisateur.**

---

### Phase 6 — Profile read/write

#### Task 13 — `PrismaProfileRepository` remplace `MockProfileRepository`

**Description :** Implémente `PrismaProfileRepository` qui satisfait `IProfileRepository`. Calcule la `ProfileView` depuis la DB :
- `profile` : `User` (name, bio→vibe, image→avatarUrl ou initiales fallback). Tags = top 3 affinités.
- `stats` : agrégats `Favorite.count`, `CalendarEntry.count`, top category.
- `breakdown` : 6 `UserCategoryAffinity`, `percent = score * 10`.
- `history` : 4 derniers `CalendarEntry` join `Activity`, order by `scheduledAt desc`.

`loadProfileView.ts` instancie `PrismaProfileRepository`. Supprime `MockProfileRepository.ts`.

**Acceptance criteria :**
- [ ] `MockProfileRepository.ts` supprimé.
- [ ] `/profile` rend des données réelles du user loggué.

**Verification :**
- [ ] Manuel : `/profile` affiche le bon user.
- [ ] `pnpm type-check && pnpm dep:check && pnpm test` vert.

**Dependencies :** Task 6.

**Files touched :**
- `src/modules/profile/infra/PrismaProfileRepository.ts` (nouveau)
- `src/modules/profile/infra/MockProfileRepository.ts` (supprimé)
- `src/modules/profile/web/loadProfileView.ts`

**Scope :** M.

---

#### Task 14 — `UpdateProfileUseCase` + `ProfileFormDTO` + tests

**Description :** Finalise `ProfileFormDTO` (`birthDate`, `gender`, `cityId`, `bio?`, `affinities: { [Category]: number 0-10 }`). Use case `UpdateProfileUseCase` : transaction Prisma — update `User`, upsert 6 `UserCategoryAffinity`, set `onboardedAt = now()` **uniquement si null** auparavant. Retourne le user mis à jour.

Tests :
- Edit profile (user déjà onboardé) → `onboardedAt` inchangé.
- Onboarding submit (`onboardedAt = null`) → `onboardedAt` setté.
- Affinités upsert (pas de doublons sur `[userId, category]`).

**Acceptance criteria :**
- [ ] Use case pure, port `IProfileWriteRepository`.
- [ ] DTO dans `shared/contracts/ProfileFormDTO.ts`.
- [ ] 3 tests verts.

**Verification :**
- [ ] `pnpm test -- UpdateProfile` vert.
- [ ] `pnpm dep:check` vert.

**Dependencies :** Task 13.

**Files touched :**
- `src/modules/profile/application/UpdateProfileUseCase.ts`
- `src/modules/profile/application/UpdateProfileUseCase.test.ts`
- `src/modules/profile/domain/IProfileWriteRepository.ts`
- `src/modules/profile/infra/PrismaProfileRepository.ts` (+ méthode write)
- `src/shared/contracts/ProfileFormDTO.ts`

**Scope :** M.

---

#### Task 15 — `PATCH /api/profile` route

**Description :** Route `withRoute` + `parseBody(ProfileFormSchema)` + `getCurrentUser()` + `new UpdateProfileUseCase(...).execute(user.id, form)`. Renvoie `{ ok: true }` (le client refresh derrière).

Zod refuse : score hors [0, 10], birthDate futur, bio > 280.

Branche `OnboardingGate.onSubmit` (Task 12) sur cette route.

**Acceptance criteria :**
- [ ] Route 1-ligne via `withRoute`.
- [ ] 401 si non-auth, 400 si Zod fail.

**Verification :**
- [ ] Manuel : submit onboarding → DB mise à jour → modale ferme.
- [ ] `pnpm type-check && pnpm test && pnpm dep:check` vert.

**Dependencies :** Task 12, Task 14.

**Files touched :**
- `src/app/api/profile/route.ts`
- `src/modules/profile/web/profileRoute.ts`

**Scope :** S.

---

#### Task 16 — `ProfilePage` : Edit profile (dismissable) + Sign out

**Description :** Wire le bouton `Edit profile` existant (`ProfilePage.tsx:48`) → toggle d'ouverture de `ProfileFormModal` (`dismissable={true}`), pré-rempli depuis `ProfileViewDTO`. Ajoute `<SignOutButton />` qui call `signOut({ fetchOptions: { onSuccess: () => router.push('/login') } })`.

Avatar : si `user.image` présent, affiche ; sinon, composant `Avatar` qui affiche les initiales (premier char `name`) sur background HSL dérivé du hash email.

**Acceptance criteria :**
- [ ] Click `Edit profile` → modale avec valeurs courantes.
- [ ] Submit OK → modale ferme, page refresh.
- [ ] Click `Sign out` → `/login`, session DB supprimée.
- [ ] Avatar initiales fallback fonctionne.

**Verification :**
- [ ] Manuel : edit bio → reload → persisté.
- [ ] Manuel : signout → cookie session supprimé.

**Dependencies :** Task 11, Task 15.

**Files touched :**
- `src/modules/profile/web/ProfilePage.tsx`
- `src/modules/auth/web/SignOutButton.tsx`
- `src/shared/ui/Avatar.tsx` (initiales fallback, réutilisable)

**Scope :** M.

---

### Checkpoint 4 — Profile end-to-end (after Task 16)

- [ ] Manuel : nouveau user → signup → popup → submit → feed personnalisé.
- [ ] Manuel : edit profile persiste.
- [ ] Manuel : signout → `/login`.
- [ ] `pnpm type-check && pnpm dep:check && pnpm test && pnpm build` vert.
- [ ] **Pause + review utilisateur.**

---

### Phase 7 — Polish

#### Task 17 — Cleanup `tbd.md` + final build

**Description :** Retire les entrées `tbd.md` couvertes (Mock→Prisma profile repo, getCurrentUser hardcoded seed). Ajoute :
- "Logout serveur instantané : déjà fait par Better Auth (DB sessions) ✅"
- "Email verification : Better Auth ready (`emailAndPassword.requireEmailVerification`), désactivé pour POC"
- "Password reset : Better Auth ready (`sendResetPassword`), à brancher quand Resend configuré"
- "Avatar upload custom : future change"

Run final `pnpm build && pnpm lint && pnpm test && pnpm type-check && pnpm dep:check`.

**Acceptance criteria :**
- [ ] `tbd.md` propre.
- [ ] Tous les commands de vérif verts.

**Verification :**
- [ ] CI vert sur PR (si demandée).

**Dependencies :** Task 16.

**Files touched :**
- `tbd.md`

**Scope :** XS.

---

## 6. Risks (mis à jour)

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | Better Auth est plus jeune qu'Auth.js — moins de StackOverflow | Low | Reco officielle 2026 ([LogRocket](https://blog.logrocket.com/best-auth-library-nextjs-2026/)). Doc complète sur better-auth.com. |
| R2 | `databaseHooks.user.create.before` query Montréal à chaque signup | Low | 1 query au signup uniquement, indexée sur `slug @unique`. Acceptable. Si problème : cache en mémoire au boot. |
| R3 | ~~Credentials force JWT~~ | ~~RÉSOLU~~ | Better Auth fait DB sessions pour les deux providers. |
| R4 | Migration : Hugo perd ses Favorite/CalendarEntry sur reseed | Low | POC, pas de données prod. `pnpm db:seed` recrée tout. Documenté dans `tbd.md`. |
| R5 | OAuth Google : si clés vides en dev, on ne peut pas tester ce chemin | Low | Better Auth ne monte pas le provider → bouton disabled. Checkpoint 2 testable sans Google. |
| R6 | Popup bloquante : API échoue → user bloqué | Low | Toast erreur + retry, conforme spec. |
| R7 | OnboardingGate refresh : `router.refresh()` ne re-fetch pas tous les Server Components si pas marqué `dynamic` | Med | Tester explicitement au Checkpoint 3. Fallback : `window.location.reload()`. |

---

## 7. Out of scope (rappel SPEC §1)

- Reset password par email.
- Vérification email.
- 2FA.
- Providers OAuth additionnels (GitHub, Apple…).
- Multi-villes (Montréal défaut).
- Avatar upload custom.
- Test E2E auto.

---

## 8. Scope summary

- **17 tasks** : 4 XS, 8 S, 5 M, 0 L, 0 XL.
- **7 phases** avec 4 checkpoints utilisateur.
- Réduction depuis le plan v1 : −4 tasks (suppression du wrapping use-case côté auth — P2).
- Tasks parallélisables : 1↔2 (foundation), 4↔5 (post Task 3).
