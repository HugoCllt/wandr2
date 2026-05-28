# Todo — Auth + Profile onboarding (Better Auth)

Each task is a vertical slice. After each task, run `pnpm type-check && pnpm dep:check && pnpm test`. Pause at every checkpoint for user review.

> Full plan → `docs/superpowers/plans/2026-05-28-auth-profile-onboarding.md` (canonical, copied in `tasks/plan.md`).
> Source spec → `docs/superpowers/specs/2026-05-28-auth-profile-onboarding-spec.md`.

---

## Phase 1 — Foundation: schema + env

- [ ] **Task 1** — Prisma schema (Better Auth shape: User/Account/Session/Verification) + our extensions (`cityId`, `gender?`, `birthDate?`, `bio?`, `onboardedAt?`) + migration.
- [ ] **Task 2** — Env vars : `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID/SECRET` (optional), `SEED_USER_PASSWORD`, `NEXT_PUBLIC_BETTER_AUTH_URL`.

## Phase 2 — Better Auth wiring

- [ ] **Task 3** — `shared/auth/auth.ts` : Better Auth instance + `databaseHooks.user.create.before` for `cityId` Montréal.
- [ ] **Task 4** — `shared/auth/auth-client.ts` : Better Auth React client (`signIn`, `signUp`, `signOut`, `useSession`).
- [ ] **Task 5** — `app/api/auth/[...all]/route.ts` : `toNextJsHandler(auth.handler)`.
- [ ] **Task 6** — Rewrite `shared/auth/current-user.ts` + audit 10 consumers + `NotAuthenticatedError → 401`.

## Phase 3 — Seed update

- [ ] **Task 7** — Rewrite `prisma/seed.ts` to use `auth.api.signUpEmail()` (Option D1).

### Checkpoint 1 — Auth backend functional

- [ ] `pnpm type-check && pnpm dep:check && pnpm test && pnpm build` vert.
- [ ] `GET /api/auth/get-session` non-auth → 200 + `null`.
- [ ] Routes existantes → 401 non-auth.
- [ ] Seed user re-créé, loggable manuellement.
- [ ] **Pause + review utilisateur.**

---

## Phase 4 — Sign-in surface

- [ ] **Task 8** — `(auth)/layout.tsx` + `app/(auth)/login/page.tsx` (redirect si déjà loggé).
- [ ] **Task 9** — `SignInForm` (toggle Sign in / Create account) + `GoogleSignInButton` (disabled si Google non configuré).

### Checkpoint 2 — Auth flow end-to-end

- [ ] Signup credentials → User + Account créés, session active.
- [ ] Signin credentials → session active.
- [ ] Signin Google (si clés configurées) → User créé, `cityId` Montréal assigné.
- [ ] **Pause + review utilisateur.**

---

## Phase 5 — Onboarding gate

- [ ] **Task 10** — `(with-sidebar)/layout.tsx` : fetch session, redirect non-auth, pass `onboardedAt` prop.
- [ ] **Task 11** — `ProfileFormModal` (UI, props `dismissable`, sliders, validation client).
- [ ] **Task 12** — `OnboardingGate` client + condition `onboardedAt === null`.

### Checkpoint 3 — Onboarding gate

- [ ] Nouveau user → popup bloquante.
- [ ] Seed user → pas de popup.
- [ ] **Pause + review utilisateur.**

---

## Phase 6 — Profile read/write

- [ ] **Task 13** — `PrismaProfileRepository` + suppression `MockProfileRepository`.
- [ ] **Task 14** — `UpdateProfileUseCase` + `ProfileFormDTO` + 3 tests.
- [ ] **Task 15** — `PATCH /api/profile` (withRoute) + branche `OnboardingGate.onSubmit`.
- [ ] **Task 16** — `ProfilePage` : Edit profile modal (dismissable) + `SignOutButton` + avatar initiales fallback.

### Checkpoint 4 — Profile end-to-end

- [ ] Signup → onboarding → submit → feed personnalisé.
- [ ] Edit profile persiste.
- [ ] Sign out → `/login`.
- [ ] **Pause + review utilisateur.**

---

## Phase 7 — Polish

- [ ] **Task 17** — Cleanup `tbd.md` + final `pnpm build && pnpm lint && pnpm test`.

---

## Final acceptance

- [ ] Visiteur `/login` → Google ou credentials.
- [ ] 1ʳᵉ connexion → popup onboarding bloquante (gender, birthDate, cityId, bio, 6 affinités).
- [ ] Feed personnalisé par affinités après onboarding.
- [ ] `/profile` : édition via popup, sign out.
- [ ] `MockProfileRepository` supprimé.
- [ ] `pnpm dep:check` vert.

---

## Locked decisions (résultat du grilling)

| # | Décision | Choix |
|---|---|---|
| A2 | Lib auth | **Better Auth** (Auth.js v5 en security-patch only en 2026) |
| B2 | Scope `modules/auth/` | Réduit à `web/` (Better Auth occupe l'edge HTTP) |
| C1 | Schéma Prisma | Convention Better Auth (`Account.password`, pas `User.passwordHash`) |
| D1 | Seed user | Re-créé via `auth.api.signUpEmail()`, `SEED_USER_PASSWORD` en env |
| 5a | OnboardingGate source | Server layout passe `onboardedAt` en prop au client |
| 5b | Login UX | `/login` unique avec toggle Sign in / Create account |
| 5c | Deeplink coverage | Mount dans `(with-sidebar)/layout` → bloquant partout |
| 5d | Avatar fallback | Initiales CSS pures (hash email → HSL) |
| 5e | Google OAuth dev | Provider non monté si `GOOGLE_*` vides, bouton disabled |
| 5f | Tests | Unit-only sur `UpdateProfileUseCase` (3 tests) |
| 5g | SPEC.md | Inchangée — divergences trackées dans le plan |
