# Todo — Authentification + Profil onboarding

Each task is a vertical slice. After each task, run `pnpm type-check && pnpm dep:check && pnpm test`. Pause at every checkpoint for user review.

> Full spec → `SPEC.md` (branch `claude/user-auth-profile-13a0L`).
> Full plan → `tasks/plan.md`.

---

## Before kickoff

- [ ] Trancher la question R3 (DB sessions vs JWT) — cf. `tasks/plan.md` §6.
- [ ] Répondre aux 4 autres open questions (Google keys, OnboardingGate scope, avatar fallback, intégration tests).

---

## Phase 1 — Foundation: schema + env

- [ ] **Task 1** — Prisma schema : Auth.js tables + User additions + migration backfill `onboardedAt`.
- [ ] **Task 2** — Env vars : AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, NEXTAUTH_URL.

## Phase 2 — `modules/auth` (pure logic, no HTTP)

- [ ] **Task 3** — Auth domain : SessionUser + IPasswordHasher + IAuthUserRepository + AuthError.
- [ ] **Task 4** — Auth infra : BcryptPasswordHasher + round-trip test.
- [ ] **Task 5** — Auth infra : PrismaAuthUserRepository (split findByEmail / findByEmailWithHash).
- [ ] **Task 6** — Auth application : RegisterWithCredentialsUseCase + 2 tests.
- [ ] **Task 7** — Auth application : VerifyCredentialsUseCase + 4 tests.

## Phase 3 — Auth.js wiring + getCurrentUser rewrite

- [ ] **Task 8** — `shared/auth/auth.ts` : Auth.js v5 config (adapter, providers, callbacks, events.createUser).
- [ ] **Task 9** — `app/api/auth/[...nextauth]/route.ts` (1 ligne).
- [ ] **Task 10** — Rewrite `shared/auth/current-user.ts` + audit des 10 consommateurs + `NotAuthenticatedError → 401`.

### Checkpoint 1 — Auth backend functional

- [ ] `pnpm type-check && pnpm dep:check && pnpm test && pnpm build` vert.
- [ ] `GET /api/auth/session` renvoie `null` non-authentifié.
- [ ] Tous les endpoints existants retournent 401 non-authentifié.
- [ ] **Pause + review utilisateur.**

---

## Phase 4 — Sign-in surface

- [ ] **Task 11** — `(auth)/layout.tsx` + `app/(auth)/login/page.tsx` (redirect si déjà loggé).
- [ ] **Task 12** — `SignInForm` + `GoogleSignInButton` client components.
- [ ] **Task 13** — `POST /api/auth/register` (withRoute + Zod + EmailAlreadyInUseError → 409).

### Checkpoint 2 — Auth flow end-to-end

- [ ] Signup credentials → user créé, session active.
- [ ] Signin credentials → session active.
- [ ] Signin Google → user créé via adapter, `cityId` Montréal assigné.
- [ ] **Pause + review utilisateur.**

---

## Phase 5 — Onboarding gate

- [ ] **Task 14** — `(with-sidebar)/layout.tsx` redirect non-auth → `/login`.
- [ ] **Task 15** — `ProfileFormModal` (UI, props `dismissable`, sliders, validation client).
- [ ] **Task 16** — `OnboardingGate` client mount + condition `onboardedAt === null`.

### Checkpoint 3 — Onboarding gate

- [ ] Nouveau user → popup bloquante.
- [ ] Seed user existant → pas de popup.
- [ ] **Pause + review utilisateur.**

---

## Phase 6 — Profile read/write (remplace mock)

- [ ] **Task 17** — `PrismaProfileRepository` + suppression `MockProfileRepository`.
- [ ] **Task 18** — `UpdateProfileUseCase` + `ProfileFormDTO` + 3 tests.
- [ ] **Task 19** — `PATCH /api/profile` (withRoute) + branche `OnboardingGate.onSubmit`.
- [ ] **Task 20** — `ProfilePage` : Edit profile modal (dismissable) + Sign out.

### Checkpoint 4 — Profile end-to-end

- [ ] Signup → onboarding → submit → feed personnalisé.
- [ ] Edit profile persiste.
- [ ] Sign out → `/login`.
- [ ] **Pause + review utilisateur.**

---

## Phase 7 — Polish

- [ ] **Task 21** — Cleanup `tbd.md` + final `pnpm build && pnpm lint && pnpm test`.

---

## Final acceptance (toute la spec)

- [ ] Visiteur arrive sur `/login`, se connecte via Google ou credentials.
- [ ] 1ʳᵉ connexion → popup onboarding bloquante (gender, birthDate, cityId, bio, 6 affinités).
- [ ] Onboarding terminé → feed personnalisé par affinités.
- [ ] `/profile` : édition via popup, sign out.
- [ ] `MockProfileRepository` supprimé.
- [ ] `pnpm dep:check` vert (DAG respecté).
