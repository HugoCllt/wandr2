# Implementation Plan — Authentification + Profil onboarding

> Plan dérivé de `SPEC.md` (branche `claude/user-auth-profile-13a0L`).
> Construit sur `claude/user-auth-profile-plan-EJIY9`.
> À valider avant d'implémenter.

---

## 1. Overview

Faire passer Wandr de POC mono-utilisateur (un seul `User` seedé) à app multi-utilisateurs authentifiés via Auth.js v5 (Google + Credentials), DB sessions, et popup d'onboarding bloquante à la 1ʳᵉ connexion. Remplacer `MockProfileRepository` par une vraie lecture DB. Aucune dette d'architecture : DAG `CLAUDE.md` strictement respecté à chaque slice.

---

## 2. Architecture decisions (rappel — détails dans SPEC.md §2)

- **Auth.js v5** (`next-auth@5.0.0-beta.x`) + `@auth/prisma-adapter` — version exacte pinnée.
- **Providers** : Google + Credentials.
- **Sessions DB** (table `Session`). *Note : avec Credentials, Auth.js v5 force JWT par défaut ; on utilisera le pattern `signIn` callback + adapter pour créer manuellement la session DB. Cf. Risque R3.*
- **Hash** : `bcryptjs` (pur JS, Vercel-friendly), cost 10.
- **Onboarding** : bloquant — `OnboardingGate` client component mount dans `(with-sidebar)/layout.tsx`, s'ouvre si `session.user.onboardedAt === null`.
- **Module** : tout l'auth dans `src/modules/auth/` (domain/application/infra/web). `shared/auth/` ne contient que `current-user.ts` (façade) et `auth.ts` (handler Auth.js).
- **DTO** : `ProfileFormDTO` (input PATCH) — distinct de `ProfileViewDTO` (output GET).

---

## 3. Dependency graph (bottom-up order of implementation)

```
[Phase 1] Schema Prisma (Account/Session/VT + User additions) + env vars
              │
              ▼
[Phase 2] modules/auth (domain → application → infra)
   ┌────────────────┴────────────────┐
   ▼                                  ▼
[Phase 3] shared/auth wiring     (parallel safe: tests-only)
   • shared/auth/auth.ts
   • api/auth/[...nextauth]/route.ts
   • getCurrentUser rewrite ← AUDIT all 10 consumers first
              │
              ▼  ← CHECKPOINT 1 (auth backend functional, app unaffected)
              │
[Phase 4] Sign-in surface
   • (auth)/login page + SignInForm + GoogleSignInButton
   • POST /api/auth/register
              │
              ▼  ← CHECKPOINT 2 (signup + signin work end-to-end)
              │
[Phase 5] Onboarding gate
   • (with-sidebar)/layout.tsx → redirect non-auth
   • ProfileFormModal (UI)
   • OnboardingGate (client, blocking when onboardedAt === null)
              │
              ▼  ← CHECKPOINT 3 (new user forced through onboarding)
              │
[Phase 6] Profile read/write (replace mock)
   • PrismaProfileRepository
   • UpdateProfileUseCase + ProfileFormDTO contract
   • PATCH /api/profile
   • Edit Profile button + SignOut button on ProfilePage
              │
              ▼  ← CHECKPOINT 4 (mock removed, end-to-end edit + logout)
              │
[Phase 7] Polish — tbd.md cleanup, build green
```

---

## 4. Task list (vertically sliced)

### Phase 1 — Foundation: schema + env

#### Task 1 — Prisma schema: Auth.js tables + User additions + backfill migration

**Description :** Ajoute `Account`, `Session`, `VerificationToken` au `schema.prisma`. Étend `User` avec `image?`, `emailVerified?`, `passwordHash?`, `bio?`, `onboardedAt?`, rend `gender` et `birthDate` nullables, ajoute relations `accounts`/`sessions`. Génère la migration et y inclut un `UPDATE` SQL backfillant `onboardedAt = NOW()` pour le user seed existant (Hugo) afin qu'il ne soit pas forcé de re-onboarder. Met à jour `prisma/seed.ts` pour seeder également `onboardedAt = now()` (l'upsert reste compatible).

**Acceptance criteria :**
- [ ] `prisma/schema.prisma` contient les 3 nouveaux modèles + champs User listés en SPEC §3.
- [ ] Migration générée (nom : `add_auth_tables_and_user_profile_fields`) contient le `UPDATE "User" SET "onboardedAt" = NOW() WHERE "onboardedAt" IS NULL` (backfill).
- [ ] `prisma/seed.ts` set `onboardedAt` à la création du user seed.
- [ ] `pnpm prisma:validate` passe.
- [ ] `pnpm db:migrate` applique sans erreur sur une DB fraîche.
- [ ] `pnpm db:seed` re-run idempotent.

**Verification :**
- [ ] `pnpm type-check && pnpm dep:check && pnpm test` vert (note : tests passent car schéma rétro-compat — `gender`/`birthDate` deviennent nullables, types optionnels).
- [ ] Vérification SQL : seed user a `onboardedAt IS NOT NULL` après migration + seed.

**Dependencies :** None.

**Files likely touched :**
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_add_auth_tables_and_user_profile_fields/migration.sql`
- `prisma/seed.ts`

**Estimated scope :** S (1-3 fichiers, principalement déclaratif).

---

#### Task 2 — Env vars: AUTH_SECRET, Google OAuth, NEXTAUTH_URL

**Description :** Étend `src/shared/config/env.ts` (Zod schema) avec `AUTH_SECRET` (min 32 char), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXTAUTH_URL` (URL). Met à jour `.env.example` (créer si absent) et vérifie que `.gitignore` ignore `.env.local`. `SEED_USER_EMAIL`/`SEED_USER_NAME` restent — uniquement consommés par `prisma/seed.ts`. Aucun secret en clair.

**Acceptance criteria :**
- [ ] `env.ts` valide les 4 nouvelles vars au boot (échoue clair si absent).
- [ ] `.env.example` liste les 4 nouvelles vars (sans valeurs).
- [ ] `.gitignore` ignore `.env.local` (déjà le cas — vérifier).
- [ ] L'application boot avec 4 valeurs factices renseignées en local (pas besoin de vraies clés Google pour les tâches qui ne touchent pas le provider Google).

**Verification :**
- [ ] `pnpm type-check` vert.
- [ ] `pnpm dev` boot sans erreur d'env quand `.env.local` est rempli.

**Dependencies :** None (parallèle à Task 1).

**Files likely touched :**
- `src/shared/config/env.ts`
- `.env.example`
- `.gitignore` (vérification seulement)

**Estimated scope :** XS.

---

### Phase 2 — `modules/auth` (domain → application → infra)

#### Task 3 — Auth domain: SessionUser, ports, errors

**Description :** Crée `modules/auth/domain/` avec :
- `SessionUser.ts` : entité (`id`, `email`, `name`, `image?`, `onboardedAt?: Date | null`). Pure.
- `IPasswordHasher.ts` : port (`hash(plain): Promise<string>`, `verify(plain, hash): Promise<boolean>`).
- `IAuthUserRepository.ts` : port (`findByEmail(email)`, `findById(id)`, `createWithPassword({ email, name, passwordHash, cityId })`).
- `AuthError.ts` : `NotAuthenticatedError`, `InvalidCredentialsError`, `EmailAlreadyInUseError`.

Aucune dépendance framework/HTTP/Prisma.

**Acceptance criteria :**
- [ ] Tous les fichiers sous `modules/auth/domain/` sont sans import de `next/*`, `@prisma/*`, `react`, `bcryptjs`.
- [ ] `pnpm dep:check` ne signale aucune arête interdite.

**Verification :**
- [ ] `pnpm type-check && pnpm dep:check` vert.

**Dependencies :** Task 1 (pour aligner les champs sur le schéma final).

**Files likely touched :**
- `src/modules/auth/domain/SessionUser.ts`
- `src/modules/auth/domain/IPasswordHasher.ts`
- `src/modules/auth/domain/IAuthUserRepository.ts`
- `src/modules/auth/domain/AuthError.ts`

**Estimated scope :** S.

---

#### Task 4 — Auth infra: BcryptPasswordHasher + test round-trip

**Description :** Implémente `BcryptPasswordHasher` (cost 10) qui satisfait `IPasswordHasher`. Ajoute `bcryptjs` + `@types/bcryptjs` aux dépendances. Test unitaire round-trip (hash → verify true / verify false sur mauvais password).

**Acceptance criteria :**
- [ ] `BcryptPasswordHasher` exporte `hash` et `verify`.
- [ ] Test `BcryptPasswordHasher.test.ts` : `hash('pw').then(h => verify('pw', h))` → true ; `verify('other', h)` → false.
- [ ] Cost ≥ 10.

**Verification :**
- [ ] `pnpm test -- BcryptPasswordHasher` vert.
- [ ] `pnpm dep:check` vert.

**Dependencies :** Task 3.

**Files likely touched :**
- `src/modules/auth/infra/BcryptPasswordHasher.ts`
- `src/modules/auth/infra/BcryptPasswordHasher.test.ts`
- `package.json` (ajout `bcryptjs`, `@types/bcryptjs`)

**Estimated scope :** XS.

---

#### Task 5 — Auth infra: PrismaAuthUserRepository

**Description :** Implémente `PrismaAuthUserRepository` qui satisfait `IAuthUserRepository`. `findByEmail` retourne `User | null` ; `createWithPassword` crée le `User` avec `onboardedAt = null`, `cityId` passé en argument (le caller fait le lookup Montréal). Pas de transactions ici (simple CRUD). Mappe vers `SessionUser` côté `findByEmail`/`findById` (ne fuit pas `passwordHash` au domain).

**Acceptance criteria :**
- [ ] `PrismaAuthUserRepository` n'expose **jamais** `passwordHash` sauf via la méthode dédiée utilisée par `VerifyCredentialsUseCase` (cf. Task 7) — pattern : méthode `findByEmailWithHash` séparée retournant `{ user: SessionUser; passwordHash: string | null } | null`.
- [ ] Tous les imports proviennent de `domain/` ou `shared/db/prisma`.

**Verification :**
- [ ] `pnpm type-check && pnpm dep:check` vert.

**Dependencies :** Task 3.

**Files likely touched :**
- `src/modules/auth/infra/PrismaAuthUserRepository.ts`

**Estimated scope :** S.

---

#### Task 6 — Auth application: RegisterWithCredentialsUseCase + tests

**Description :** Use case orchestrant l'inscription par email/password : input `{ email, name, password }`. Lookup ville Montréal via `ICityLookup` port léger (`findMontrealId()`). Vérifie que l'email n'existe pas, hash le password, crée le user. Renvoie `SessionUser`. Lève `EmailAlreadyInUseError` si existe déjà.

Tests :
- email déjà pris → `EmailAlreadyInUseError`.
- succès → user créé, `passwordHash` non null en DB (test sur fake repo), `onboardedAt === null`.

**Acceptance criteria :**
- [ ] Use case sous `modules/auth/application/`.
- [ ] Aucune dépendance directe à Prisma ; tout passe par ports.
- [ ] 2 tests verts (cas erreur + cas succès) avec fake repo en mémoire.

**Verification :**
- [ ] `pnpm test -- RegisterWithCredentials` vert.
- [ ] `pnpm dep:check` vert.

**Dependencies :** Task 3, Task 4, Task 5.

**Files likely touched :**
- `src/modules/auth/application/RegisterWithCredentialsUseCase.ts`
- `src/modules/auth/application/RegisterWithCredentialsUseCase.test.ts`
- `src/modules/auth/domain/ICityLookup.ts` (port léger : `findMontrealId()`)
- `src/modules/auth/infra/PrismaCityLookup.ts`

**Estimated scope :** M.

---

#### Task 7 — Auth application: VerifyCredentialsUseCase + tests

**Description :** Use case appelé par le provider Credentials d'Auth.js (depuis `authorize()`). Input : `{ email, password }`. Retourne `SessionUser | null`. Implémentation :
1. `repo.findByEmailWithHash(email)`.
2. Si null, ou `passwordHash` null (compte OAuth-only), retourne null.
3. `hasher.verify(password, passwordHash)` → si false, null ; si true, retourne le `SessionUser`.

Tests :
- password valide → `SessionUser`.
- password invalide → null.
- user OAuth-only (passwordHash null) → null.
- user inexistant → null.

**Acceptance criteria :**
- [ ] 4 tests verts.
- [ ] Aucune erreur thrown — retourne null sur tout échec (contrat Credentials).

**Verification :**
- [ ] `pnpm test -- VerifyCredentials` vert.

**Dependencies :** Task 3, Task 4, Task 5.

**Files likely touched :**
- `src/modules/auth/application/VerifyCredentialsUseCase.ts`
- `src/modules/auth/application/VerifyCredentialsUseCase.test.ts`

**Estimated scope :** S.

---

### Phase 3 — Auth.js wiring (HTTP edge + getCurrentUser rewrite)

#### Task 8 — `shared/auth/auth.ts` : Auth.js v5 config + handler

**Description :** Crée le point d'entrée Auth.js : exporte `auth`, `signIn`, `signOut`, `handlers`. Config :
- `adapter: PrismaAdapter(prisma)`.
- `session: { strategy: 'database' }` — IMPORTANT : voir Risque R3 pour le pattern Credentials + DB sessions (callback `signIn` + création manuelle de Session si JWT).
- `providers: [Google({ clientId, clientSecret }), Credentials({ authorize: async (creds) => await new VerifyCredentialsUseCase(...).execute(creds) })]`.
- `callbacks.session` : injecte `user.onboardedAt`, `user.image` dans `session.user`.
- `events.createUser` : assigne `cityId = montrealId` au User créé via OAuth (sinon l'adapter laisse cityId vide → contrainte FK violée). À tester explicitement.
- `pages: { signIn: '/login' }`.

Le fichier vit dans `shared/auth/` (pas dans `modules/auth/` car c'est la couche de configuration Next/Auth.js, partagée).

**Acceptance criteria :**
- [ ] `auth`, `signIn`, `signOut`, `handlers` exportés.
- [ ] `events.createUser` setté pour assigner `cityId` Montréal au nouveau user OAuth.
- [ ] `callbacks.session` renvoie `onboardedAt` dans `session.user` (typage augmenté via `next-auth.d.ts` module declaration).
- [ ] Aucune logique métier dans ce fichier — il câble les use cases du module auth.

**Verification :**
- [ ] `pnpm type-check && pnpm dep:check` vert.

**Dependencies :** Task 6, Task 7.

**Files likely touched :**
- `src/shared/auth/auth.ts`
- `src/shared/auth/next-auth.d.ts` (module augmentation)
- `package.json` (ajout `next-auth@5.0.0-beta.X`, `@auth/prisma-adapter`)

**Estimated scope :** M.

---

#### Task 9 — `app/api/auth/[...nextauth]/route.ts`

**Description :** Catch-all route handler Auth.js. Une ligne : `export const { GET, POST } = handlers;`. **Ne pas** wrapper avec `withRoute` — Auth.js gère ses propres erreurs HTTP.

**Acceptance criteria :**
- [ ] Fichier d'1 ligne d'export.
- [ ] `pnpm dev` → `curl http://localhost:3000/api/auth/session` renvoie `{}` (pas d'erreur 500, juste pas de session).

**Verification :**
- [ ] `pnpm build` vert (next reconnaît la route).
- [ ] Manuel : `/api/auth/providers` liste Google + Credentials.

**Dependencies :** Task 8.

**Files likely touched :**
- `src/app/api/auth/[...nextauth]/route.ts`

**Estimated scope :** XS.

---

#### Task 10 — Rewrite `shared/auth/current-user.ts` + audit des 10 consommateurs

**Description :** Remplace l'implémentation de `getCurrentUser()` :
- Plus de `let cached` ni de `SEED_USER_EMAIL`.
- Implémentation : `const session = await auth(); if (!session?.user) throw new NotAuthenticatedError();`. Lookup `cityId` depuis DB (le session ne porte pas tout — keep payload léger). Retourne `CurrentUser`.
- Type augmenté : `CurrentUser` inclut désormais `onboardedAt: Date | null`.

**Audit obligatoire avant** : les 10 consommateurs actuels (`favorites`, `feed`, `chat`, `calendar`, `profile` web/routes) — vérifier qu'aucun ne casse. Le handler error-handler doit mapper `NotAuthenticatedError` → 401.

**Acceptance criteria :**
- [ ] `current-user.ts` n'importe plus `env.SEED_USER_EMAIL`.
- [ ] Plus aucune référence à `let cached` dans le fichier.
- [ ] `NotAuthenticatedError` ajouté à `handleApiError` → 401.
- [ ] Les 10 consommateurs identifiés (cf. audit grep `getCurrentUser`) sont tous testés en non-authentifié → 401 propre (les pages doivent rediriger plus tôt via layout — Phase 5 — mais les routes API renvoient 401).

**Verification :**
- [ ] `pnpm type-check && pnpm dep:check && pnpm test` vert.
- [ ] Manuel : `curl http://localhost:3000/api/feed` non-authentifié → 401.
- [ ] Manuel : `curl http://localhost:3000/api/feed` avec cookie session valide → 200.

**Dependencies :** Task 8, Task 9.

**Files likely touched :**
- `src/shared/auth/current-user.ts`
- `src/app/api/_lib/error-handler.ts` (+ entrée `NotAuthenticatedError`)

**Estimated scope :** S (mais audit large — la modification du fichier reste petite).

---

### Checkpoint 1 — Auth backend functional (after Task 10)

- [ ] `pnpm type-check && pnpm dep:check && pnpm test` vert.
- [ ] `pnpm build` vert.
- [ ] `GET /api/auth/session` renvoie `null` non-authentifié.
- [ ] `GET /api/auth/providers` liste Google + Credentials.
- [ ] Tous les endpoints existants (`/api/feed`, `/api/favorites`, …) retournent 401 non-authentifié.
- [ ] **Pause + review utilisateur.**

---

### Phase 4 — Sign-in surface (signup + signin work end-to-end)

#### Task 11 — Layout `(auth)` + `app/(auth)/login/page.tsx`

**Description :** Crée `src/app/(auth)/layout.tsx` (minimal, pas de sidebar/edge-art) et `src/app/(auth)/login/page.tsx` (server component) qui rend les deux composants client du formulaire. Si l'utilisateur a déjà une session, redirige vers `/`.

**Acceptance criteria :**
- [ ] `/login` charge sans crash, affiche le formulaire credentials + bouton Google.
- [ ] Session active → redirect vers `/`.

**Verification :**
- [ ] Manuel : navigation `/login`.
- [ ] `pnpm dep:check` vert.

**Dependencies :** Task 10.

**Files likely touched :**
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`

**Estimated scope :** S.

---

#### Task 12 — `SignInForm` + `GoogleSignInButton` client components

**Description :** Composants client dans `modules/auth/web/`. `SignInForm` : champs email + password + "create account" toggle (réutilise `POST /api/auth/register` quand toggle ON). Submit credentials → `signIn('credentials', { email, password, redirect: false })`, erreur claire si InvalidCredentials. `GoogleSignInButton` : `signIn('google')`.

**Acceptance criteria :**
- [ ] Deux composants `'use client'`.
- [ ] Erreur affichée si credentials invalides.
- [ ] Pas de logique métier — délégation à `signIn`/route API.

**Verification :**
- [ ] Manuel : tentative login avec mauvais password → erreur visible.
- [ ] `pnpm dep:check` vert.

**Dependencies :** Task 11.

**Files likely touched :**
- `src/modules/auth/web/SignInForm.tsx`
- `src/modules/auth/web/GoogleSignInButton.tsx`

**Estimated scope :** M.

---

#### Task 13 — `POST /api/auth/register` route

**Description :** Route handler classique pattern `withRoute` + `parseBody` (Zod schema `{ email, name, password (min 8) }`) + call `new RegisterWithCredentialsUseCase(...).execute(...)`. Mappe `EmailAlreadyInUseError` → 409 dans `handleApiError`. Réponse `{ ok: true }` (le client appellera `signIn` derrière). Ne pose **pas** de session lui-même.

**Acceptance criteria :**
- [ ] Route 1-ligne via `withRoute(registerHandler)`.
- [ ] Zod valide email format + password min 8 + name non vide.
- [ ] 409 sur email déjà pris.
- [ ] `passwordHash` jamais retourné.

**Verification :**
- [ ] `pnpm test` (handler peut être testé via supertest-like mock ou e2e manuel).
- [ ] Manuel : POST `/api/auth/register` avec curl → user créé en DB.
- [ ] `pnpm dep:check` vert.

**Dependencies :** Task 6, Task 12.

**Files likely touched :**
- `src/app/api/auth/register/route.ts`
- `src/modules/auth/web/registerRoute.ts`
- `src/app/api/_lib/error-handler.ts` (+ `EmailAlreadyInUseError` → 409)

**Estimated scope :** S.

---

### Checkpoint 2 — Auth flow end-to-end (after Task 13)

- [ ] **Manuel** : Signup credentials → user créé en DB, session cookie posé, redirect `/`.
- [ ] **Manuel** : Signin credentials → session active.
- [ ] **Manuel** : Signin Google (avec vraies clés OAuth en dev) → user créé par adapter, `cityId` Montréal assigné.
- [ ] `pnpm type-check && pnpm dep:check && pnpm test && pnpm build` vert.
- [ ] **Pause + review utilisateur.**

---

### Phase 5 — Onboarding gate

#### Task 14 — `(with-sidebar)/layout.tsx` redirige non-authentifié

**Description :** Étend `src/app/(with-sidebar)/layout.tsx` (server) : `const session = await auth(); if (!session) redirect('/login');`. Aucun autre changement — garde `listNeighborhoods()` etc.

**Acceptance criteria :**
- [ ] Tout `/`, `/sport`, `/profile`, etc. → redirect `/login` si pas de session.
- [ ] Pas d'impact sur les routes API (handler-level error 401 toujours là).

**Verification :**
- [ ] Manuel : `curl -L http://localhost:3000/` non-authentifié → page `/login`.
- [ ] `pnpm dep:check` vert.

**Dependencies :** Task 10.

**Files likely touched :**
- `src/app/(with-sidebar)/layout.tsx`

**Estimated scope :** XS.

---

#### Task 15 — `ProfileFormModal` (UI, agnostique du mode bloquant)

**Description :** Composant client dans `modules/profile/web/`. Réutilise le pattern visuel de la modale d'activité (à identifier dans `modules/activities/web/`). Props : `initial: ProfileFormDTO`, `dismissable: boolean`, `onSubmit: (form) => Promise<void>`. Champs : `birthDate`, `gender`, `cityId` (select, défaut Montréal), `bio` (textarea 280 max), 6 sliders affinités. Affiche un toast d'erreur en cas d'échec submit, garde la modale ouverte.

**Acceptance criteria :**
- [ ] Composant 100 % client (`'use client'`).
- [ ] Pas d'accès direct à `prisma` ou `fetch('/api/profile')` — délégation via prop `onSubmit`.
- [ ] Si `dismissable === false`, aucune façon de fermer (pas de close button, pas de overlay-click-to-close, pas de ESC).
- [ ] Valide côté client avant submit (champs requis : birthDate, gender).

**Verification :**
- [ ] Manuel : monter dans une page de test, vérifier UX bloquante.
- [ ] `pnpm dep:check` vert.

**Dependencies :** Task 1 (pour les types/DTO finaux — note : DTO créé en Task 18).

**Files likely touched :**
- `src/modules/profile/web/ProfileFormModal.tsx`
- `src/shared/contracts/ProfileFormDTO.ts` (création stub minimale, finalisée en Task 18)

**Estimated scope :** M (formulaire avec 9+ champs).

---

#### Task 16 — `OnboardingGate` client mount

**Description :** Composant client `OnboardingGate.tsx` monté dans `(with-sidebar)/layout.tsx`. Lit la session côté client (`useSession` d'Auth.js, ou prop du layout server). Si `session.user.onboardedAt === null`, rend `<ProfileFormModal dismissable={false} initial={...defaults} onSubmit={postProfile} />`. Sinon, rien. Au submit OK → `router.refresh()` pour repop la session avec `onboardedAt` posé.

**Note** : tant que Task 19 (PATCH route) n'est pas faite, `onSubmit` peut être un stub qui throw — la gate doit déjà être mountée pour valider visuellement.

**Acceptance criteria :**
- [ ] Mount sans crash quand session présente.
- [ ] Popup visible si `onboardedAt === null` ; absente sinon.
- [ ] Aucun import de Prisma ni de use case (client component).

**Verification :**
- [ ] Manuel : seed user (`onboardedAt` posé via backfill) → pas de popup. Nouveau user créé via signup → popup bloquante.
- [ ] `pnpm dep:check` vert.

**Dependencies :** Task 14, Task 15.

**Files likely touched :**
- `src/modules/profile/web/OnboardingGate.tsx`
- `src/app/(with-sidebar)/layout.tsx` (mount le gate)

**Estimated scope :** S.

---

### Checkpoint 3 — Onboarding gate (after Task 16)

- [ ] **Manuel** : nouveau user → popup bloquante au premier `/`.
- [ ] **Manuel** : seed user existant → pas de popup.
- [ ] `pnpm type-check && pnpm dep:check && pnpm test` vert.
- [ ] **Pause + review utilisateur.**

---

### Phase 6 — Profile read/write (replace mock)

#### Task 17 — `PrismaProfileRepository` remplace `MockProfileRepository`

**Description :** Implémente `PrismaProfileRepository` qui satisfait `IProfileRepository`. Calcule la `ProfileView` depuis la DB :
- `profile` : lit `User` (name, bio comme vibe, image comme avatarUrl). Tags : dérivés des top 3 affinités (label = nom catégorie, kind alterné warm/cool/'').
- `stats` : agrégats `Favorite.count`, `CalendarEntry.count`, top category from affinities.
- `breakdown` : 6 affinités catégories, `percent = score * 10` (score 0-10 → 0-100%).
- `history` : 4 derniers `CalendarEntry` joints à `Activity` (limit 4, order by `scheduledAt desc`).

`loadProfileView.ts` instancie `PrismaProfileRepository` au lieu de `MockProfileRepository`.

**Acceptance criteria :**
- [ ] Aucun import de `MockProfileRepository` ailleurs.
- [ ] `MockProfileRepository.ts` supprimé.
- [ ] Page `/profile` rend des données réelles du seed user.

**Verification :**
- [ ] Manuel : `/profile` affiche le nom du seed user, ses affinités, ses favoris/calendar.
- [ ] `pnpm type-check && pnpm dep:check && pnpm test` vert.

**Dependencies :** Task 14 (auth requis pour accéder à `/profile`).

**Files likely touched :**
- `src/modules/profile/infra/PrismaProfileRepository.ts` (nouveau)
- `src/modules/profile/infra/MockProfileRepository.ts` (supprimé)
- `src/modules/profile/web/loadProfileView.ts` (swap impl)

**Estimated scope :** M.

---

#### Task 18 — `UpdateProfileUseCase` + `ProfileFormDTO` contract + tests

**Description :** Finalise `ProfileFormDTO` (`birthDate`, `gender`, `cityId`, `bio?`, `affinities: { [Category]: number }`). Use case `UpdateProfileUseCase` : transaction Prisma — update `User` (champs), upsert 6 `UserCategoryAffinity`, set `onboardedAt = now()` **uniquement si `onboardedAt` était null** (sinon ne le touche pas). Renvoie le `SessionUser` mis à jour.

Tests :
- Edit profile (user déjà onboardé) → `onboardedAt` inchangé, autres champs mis à jour.
- Onboarding submit (user `onboardedAt = null`) → `onboardedAt` setté à `now()`.
- Affinités : upsert (pas de doublons sur `[userId, category]`).

**Acceptance criteria :**
- [ ] Use case pure, port `IProfileWriteRepository` (méthode `updateProfile(userId, form)` transactionnelle).
- [ ] DTO dans `shared/contracts/ProfileFormDTO.ts`.
- [ ] 3 tests verts.

**Verification :**
- [ ] `pnpm test -- UpdateProfile` vert.
- [ ] `pnpm dep:check` vert.

**Dependencies :** Task 17.

**Files likely touched :**
- `src/modules/profile/application/UpdateProfileUseCase.ts`
- `src/modules/profile/application/UpdateProfileUseCase.test.ts`
- `src/modules/profile/domain/IProfileWriteRepository.ts`
- `src/modules/profile/infra/PrismaProfileRepository.ts` (ajout méthode write — ou repo séparé)
- `src/shared/contracts/ProfileFormDTO.ts`

**Estimated scope :** M.

---

#### Task 19 — `PATCH /api/profile` route

**Description :** Route `withRoute` + Zod schema `ProfileFormDTO`. Appelle `UpdateProfileUseCase` avec `user.id` issu de `getCurrentUser()`. Renvoie le DTO de session mis à jour. Branche le `OnboardingGate.onSubmit` (Task 16) sur cette route.

**Acceptance criteria :**
- [ ] Route 1-ligne via `withRoute`.
- [ ] Zod refuse `score` hors [0, 10], `birthDate` futur, `bio` > 280.
- [ ] 401 si non-authentifié.

**Verification :**
- [ ] Manuel : submit onboarding → POST réussi → modale se ferme → `onboardedAt` posé en DB.
- [ ] `pnpm type-check && pnpm test && pnpm dep:check` vert.

**Dependencies :** Task 18, Task 16.

**Files likely touched :**
- `src/app/api/profile/route.ts`
- `src/modules/profile/web/profileRoute.ts`

**Estimated scope :** S.

---

#### Task 20 — `ProfilePage` : Edit profile (dismissable modal) + Sign out

**Description :** Wire le bouton `Edit profile` existant (`ProfilePage.tsx:48`) à un toggle d'ouverture de `ProfileFormModal` (`dismissable={true}`), pré-rempli depuis le `ProfileViewDTO`. Ajoute un bouton `Sign out` (section actions) qui call `signOut({ callbackUrl: '/login' })`.

**Acceptance criteria :**
- [ ] Click `Edit profile` → modal ouverte avec valeurs courantes.
- [ ] Submit OK → modale ferme, page refresh.
- [ ] Click `Sign out` → redirect `/login`, session DB supprimée.

**Verification :**
- [ ] Manuel : edit bio → reload → bio persistée.
- [ ] Manuel : signout → cookie session supprimé → `/` redirige `/login`.
- [ ] `pnpm dep:check` vert.

**Dependencies :** Task 15, Task 19.

**Files likely touched :**
- `src/modules/profile/web/ProfilePage.tsx`
- `src/modules/auth/web/SignOutButton.tsx`

**Estimated scope :** S.

---

### Checkpoint 4 — Profile end-to-end (after Task 20)

- [ ] **Manuel** : nouveau user → signup → popup → submit → feed personnalisé.
- [ ] **Manuel** : edit profile → bio mise à jour persiste.
- [ ] **Manuel** : signout → /login.
- [ ] `pnpm type-check && pnpm dep:check && pnpm test && pnpm build` vert.
- [ ] **Pause + review utilisateur.**

---

### Phase 7 — Polish

#### Task 21 — Cleanup `tbd.md` + final build

**Description :** Supprime les entrées `tbd.md` couvertes par ce travail (Mock→Prisma profile repo). Ajoute les entrées future-change identifiées en SPEC §3.3 : email verification, password reset, avatar upload. Run final build + test.

**Acceptance criteria :**
- [ ] `tbd.md` propre, entrées obsolètes retirées, futures changes documentées avec file:line.
- [ ] `pnpm build && pnpm test && pnpm type-check && pnpm dep:check && pnpm lint` tous verts.

**Verification :**
- [ ] CI green sur PR ouverte (si demandée par user).

**Dependencies :** Task 20.

**Files likely touched :**
- `tbd.md`

**Estimated scope :** XS.

---

## 5. Risks and Mitigations

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | Auth.js v5 est en beta — API peut bouger | Med | Pin version exacte (pas de `^`). Documenter la version dans tbd.md. |
| R2 | DAG infra-only pour Auth.js : `authConfig` référence `PrismaAdapter` | Low | `shared/auth/auth.ts` est explicitement la couche de configuration cross-cutting. Use cases ne l'importent jamais — ils dépendent des ports `modules/auth/domain/`. `dep:check` valide. |
| R3 | **Credentials + DB sessions** : Auth.js v5 force JWT pour Credentials par défaut. Hybride OAuth (DB) + Credentials (JWT) = bug subtil sur logout/session. | **High** | Approche : utiliser JWT pour tout (plus simple, supporté nativement) **OU** implémenter le callback `signIn` qui crée manuellement une `Session` DB pour les Credentials. **À trancher avant Task 8.** Recommandation : **JWT pour POC** (simplifie, sacrifie logout serveur instantané — acceptable au stade POC). Si JWT : retirer "DB sessions" de la spec et mettre à jour. |
| R4 | Migration nullable de `gender`/`birthDate` casse les types côté UI/use cases existants | Med | Audit avant Task 1 : grep `\.gender\b` et `\.birthDate\b` dans `src/`. Si casse → fallback "Non renseigné" dans l'UI consommatrice. À résoudre dans Task 1 si nécessaire. |
| R5 | OAuth Google : `events.createUser` callback doit setter `cityId` sinon contrainte FK échoue | Med | Test manuel explicite dans Checkpoint 2 (signin Google nouveau user). Logger si callback fail. |
| R6 | Popup bloquante : si l'API échoue, l'user est bloqué | Low | Toast erreur + bouton retry. Pas de close, conforme à la spec. |
| R7 | Performance : suppression du `cached` global dans `getCurrentUser` ajoute un round-trip DB par requête | Low | Acceptable au stade POC. Auth.js fait déjà sa propre query session. |

---

## 6. Open questions (require human input avant kickoff)

1. **R3 — DB sessions vs JWT** : la spec demande DB sessions, mais Auth.js v5 + Credentials force JWT par défaut. Tu acceptes de basculer en JWT (POC simplifié) ou tu veux qu'on implémente le pattern signIn callback pour DB sessions ? (recommandation : **JWT**, on garde DB sessions comme future change.)
2. **Google OAuth en dev** : tu as déjà des clés Google OAuth dispo (compte console GCP) ou il faut prévoir un fallback "Credentials only" pour les tests Checkpoint 2 ?
3. **`OnboardingGate`** : tu veux un comportement "popup bloquante au premier `/`" ou aussi en deeplink (ex: user navigue directement à `/sport` non-onboardé — popup s'ouvre quand même) ? (recommandation : mount dans le layout `(with-sidebar)` → bloquant partout.)
4. **Avatar fallback** : initiales générées en CSS pur ou via service externe (DiceBear, UI Avatars) ? (recommandation : **initiales CSS** — zéro dépendance.)
5. **Tests d'intégration sur les routes API auth** : SPEC §7 ne les mentionne pas, mais Auth.js wiring est subtil. On ajoute un test d'intégration sur `/api/auth/register` + `/api/auth/session` ou on reste 100 % unit ? (recommandation : **rester unit** au stade POC, validation manuelle aux checkpoints.)

---

## 7. Out of scope (rappel SPEC §1)

- Reset password par email.
- Vérification email.
- 2FA.
- Providers OAuth additionnels (GitHub, Apple…).
- Multi-villes (Montréal reste défaut).
- Avatar upload custom.
- Test E2E auto.

---

## 8. Total scope estimate

- **21 tasks** : 5 XS, 9 S, 7 M, 0 L, 0 XL.
- **7 phases** avec 4 checkpoints utilisateur.
- Ordre strict (Task 1/2 parallèles ; Task 4/5/7 partiellement parallèles).

**Avant kickoff** : trancher R3 (DB sessions vs JWT) — c'est le seul fork majeur.
