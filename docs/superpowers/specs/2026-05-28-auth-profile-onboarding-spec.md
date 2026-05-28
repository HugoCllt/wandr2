# SPEC — Authentification + Profil utilisateur

> Spec issue d'un brainstorming spec-driven (skill `spec`). À valider avant d'écrire du code.
> Branche : `claude/user-auth-profile-13a0L`.

---

## 1. Objectif

Faire passer Wandr de **POC mono-utilisateur** (un seul `User` seedé, identifié par `SEED_USER_EMAIL`) à **application multi-utilisateurs authentifiés**, sans casser l'architecture modulaire de `CLAUDE.md`.

À la fin de cette spec :

1. Un visiteur arrive sur `/login`, se connecte via **Google** ou **email/mot de passe**.
2. À la 1ʳᵉ connexion, une **popup d'onboarding bloquante** (même style visuel que la modale d'activité) collecte : `gender`, `birthDate`, `cityId`, `bio`, et les affinités de catégories (sliders).
3. Une fois l'onboarding terminé, l'utilisateur navigue normalement. Le feed est **personnalisé par ses affinités** (mécanique déjà en place via `UserCategoryAffinity` + `GetFeedUseCase`).
4. Depuis `/profile`, l'utilisateur peut **rouvrir le formulaire** (popup) pour éditer ses infos, et **se déconnecter**.
5. `MockProfileRepository` est remplacé par une vraie lecture DB (déjà tracké dans `tbd.md`).

**Hors scope** : reset password par email, vérification email, 2FA, social providers autres que Google, gestion multi-villes (Montréal reste la seule ville seedée → défaut `cityId`).

---

## 2. Décisions arrêtées (issues du brainstorm)

| Décision | Choix | Justification |
|---|---|---|
| Lib auth | **Auth.js v5** (`next-auth@beta`) + `@auth/prisma-adapter` | Self-hosted, gratuit illimité, intégration native Next.js App Router, standard de fait. |
| Providers | **Google** + **Credentials** (email + password) | Pas de vendor lock-in, deux chemins d'entrée. |
| Sessions | **DB sessions** (table `Session` en Postgres) | Logout serveur instantané, requis pour combiner Credentials + OAuth proprement. |
| Onboarding | **Bloquant à la 1ʳᵉ connexion** | Garantit que le feed est toujours personnalisé. |
| Hash password | `bcryptjs` (pur JS, pas de binaire natif → Vercel-friendly) | Auth.js Credentials ne hash pas pour toi. |
| Avatar | Récupéré depuis Google si OAuth, sinon initiales générées côté UI | Pas d'upload custom (hors scope). |

---

## 3. Modèle de données — modifications Prisma

### 3.1 Nouveaux modèles (requis par `@auth/prisma-adapter`)

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### 3.2 Modifications du modèle `User`

```prisma
model User {
  id              String                 @id @default(cuid())
  email           String                 @unique
  name            String
  image           String?                // ← NOUVEAU : URL avatar (Google ou null)
  emailVerified   DateTime?              // ← NOUVEAU : requis par adapter
  passwordHash    String?                // ← NOUVEAU : null pour OAuth-only users
  bio             String?                // ← NOUVEAU : "vibe" affiché sur ProfilePage
  onboardedAt     DateTime?              // ← NOUVEAU : null = doit voir la popup
  createdAt       DateTime               @default(now())
  cityId          String                 // garde requis, défaut Montréal via use case
  city            City                   @relation(fields: [cityId], references: [id])
  gender          Gender?                // ← devient nullable (rempli à l'onboarding)
  birthDate       DateTime?              @db.Date // ← devient nullable
  accounts        Account[]              // ← NOUVEAU
  sessions        Session[]              // ← NOUVEAU
  affinities      UserCategoryAffinity[]
  favorites       Favorite[]
  calendarEntries CalendarEntry[]
}
```

**Note migration** : le seed user existant (Hugo, MALE, 2000-06-28) ne casse pas — `gender` et `birthDate` deviennent juste *optionnellement* renseignés. `onboardedAt` est backfillé à `now()` pour lui via migration SQL pour ne pas le forcer à refaire l'onboarding.

### 3.3 Tracking dans `tbd.md`

- Email verification (`emailVerified` est posé mais jamais setté) → future change.
- Reset password flow → future change.
- Avatar upload custom → future change.

---

## 4. Architecture — modules touchés (conformité CLAUDE.md)

### 4.1 Nouveau module : `src/modules/auth/`

```
modules/auth/
├── domain/
│   ├── AuthError.ts                  # NotAuthenticatedError, InvalidCredentialsError
│   ├── PasswordHasher.ts             # port IPasswordHasher
│   └── SessionUser.ts                # entité domaine (id, email, name, image, onboardedAt)
├── application/
│   ├── RegisterWithCredentialsUseCase.ts
│   ├── VerifyCredentialsUseCase.ts   # appelé par Credentials provider authorize()
│   └── ports.ts                      # ré-exporte IUserRepository, IPasswordHasher
├── infra/
│   ├── BcryptPasswordHasher.ts
│   ├── PrismaAuthUserRepository.ts
│   └── authConfig.ts                 # objet NextAuthConfig (providers, callbacks)
└── web/
    ├── SignInForm.tsx                # email/password form
    ├── GoogleSignInButton.tsx
    └── SignOutButton.tsx
```

### 4.2 Modifications `src/modules/profile/`

- **Remplace** `MockProfileRepository` par `PrismaProfileRepository` (déjà tracké dans `tbd.md` ligne 20).
- **Nouveau** `UpdateProfileUseCase` (écrit `gender`, `birthDate`, `cityId`, `bio`, affinités, set `onboardedAt`).
- **Nouveau** `OnboardingGate.tsx` (composant client qui ouvre la popup si `onboardedAt === null`).
- **Nouveau** `ProfileFormModal.tsx` (popup réutilisant le pattern visuel de la modale activité).

### 4.3 Modifications `src/shared/`

- **`shared/auth/current-user.ts`** : devient un wrapper autour de `getServerSession()` d'Auth.js. Supprime le `cached` global (anti-pattern multi-user) et le fallback `SEED_USER_EMAIL`.
- **`shared/auth/auth.ts`** *(nouveau)* : exporte `auth`, `signIn`, `signOut` d'Auth.js v5 (point d'entrée unique).
- **`shared/contracts/ProfileFormDTO.ts`** *(nouveau)* : DTO pour le formulaire (input du PATCH `/api/profile`).

### 4.4 Nouvelles routes Next.js

```
src/app/
├── (auth)/
│   ├── login/page.tsx                # SignInForm + GoogleSignInButton
│   └── layout.tsx                    # layout minimal, pas de sidebar
├── api/
│   ├── auth/[...nextauth]/route.ts   # handler Auth.js (export const { GET, POST } = handlers)
│   ├── auth/register/route.ts        # POST → RegisterWithCredentialsUseCase, withRoute()
│   └── profile/route.ts              # PATCH → UpdateProfileUseCase, withRoute()
└── (with-sidebar)/
    └── layout.tsx                    # MODIF : redirige vers /login si non connecté
                                      #          + monte <OnboardingGate />
```

### 4.5 DAG respecté ?

```
web (ProfilePage, SignInForm) → application (UpdateProfile, VerifyCredentials) → domain (SessionUser, ports)
                                                                              ↘
infra (PrismaAuthUserRepository, BcryptPasswordHasher) → domain
shared/auth → domain (importe SessionUser type only)
```

Aucune arête interdite. **`pnpm dep:check` doit rester vert.**

---

## 5. Flow utilisateur — détaillé

### 5.1 Signup (email/password)

1. `POST /api/auth/register` avec `{ email, password, name }`.
2. `RegisterWithCredentialsUseCase` :
   - Vérifie qu'il n'existe pas déjà.
   - Hash le password (`bcryptjs.hash`, cost 10).
   - Crée `User` avec `cityId = montrealId` (lookup), `onboardedAt = null`.
3. Auto-login : appelle `signIn('credentials', { email, password, redirect: false })`.
4. Redirige vers `/` → `OnboardingGate` détecte `onboardedAt === null` → ouvre la popup.

### 5.2 Signin (Google)

1. Clic `GoogleSignInButton` → `signIn('google')`.
2. Callback Auth.js → `@auth/prisma-adapter` crée le `User` si nouveau (avec `cityId` à compléter par `events.createUser`).
3. Premier login → `onboardedAt === null` → popup d'onboarding s'ouvre.

### 5.3 Popup d'onboarding (premier login)

- Composant `ProfileFormModal` monté par `OnboardingGate` avec prop `dismissable={false}`.
- Champs :
  - `birthDate` (input date, requis)
  - `gender` (radio MALE/FEMALE/OTHER, requis)
  - `cityId` (select, défaut Montréal — UI placeholder pour le multi-cities futur)
  - `bio` (textarea 280 char, optionnel)
  - 6 sliders 0–10 pour `UserCategoryAffinity` (SPORT, FOOD, CULTURE, OUTDOOR, NIGHTLIFE, ROMANTIC)
- Submit → `PATCH /api/profile` → `UpdateProfileUseCase` (transactionnel : update User + upsert affinités + set `onboardedAt = now()`).
- Au retour OK, ferme la popup et `router.refresh()`.

### 5.4 Édition profil (depuis `/profile`)

- Bouton `Edit profile` (déjà présent dans `ProfilePage.tsx:48`) → ouvre `ProfileFormModal` avec `dismissable={true}`.
- Même formulaire pré-rempli depuis le DTO.
- Submit met à jour, `onboardedAt` ne change pas.

### 5.5 Logout

- Bouton `Sign out` ajouté dans `ProfilePage` (section actions ou header).
- `signOut({ callbackUrl: '/login' })`.

---

## 6. Commandes / scripts

Aucun nouveau script. Tout passe par les commandes existantes (`CLAUDE.md` §"Verification commands") :

```bash
pnpm db:migrate     # migration prisma pour Account/Session/VerificationToken + User additions
pnpm type-check     # tsc --noEmit
pnpm dep:check      # garantit que les nouvelles arêtes respectent le DAG
pnpm test           # tests unitaires
pnpm lint
pnpm build          # avant commit final
```

**Variables d'env à ajouter** (`src/shared/config/env.ts`) :

```
AUTH_SECRET=                 # openssl rand -base64 32
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXTAUTH_URL=                # http://localhost:3000 en dev
```

`SEED_USER_EMAIL` est conservé pour le seed/dev mais **n'est plus lu par `getCurrentUser`**.

---

## 7. Tests

Niveau minimum acceptable (cohérent avec le reste du repo qui privilégie tests unitaires sur les use cases) :

- `RegisterWithCredentialsUseCase` : email déjà pris → erreur ; succès → user créé avec `passwordHash` non null et `onboardedAt = null`.
- `VerifyCredentialsUseCase` : password valide → SessionUser ; invalide → null ; user OAuth (passwordHash null) → null.
- `UpdateProfileUseCase` : set des affinités (upsert), `onboardedAt` setté la 1ʳᵉ fois et seulement là.
- `BcryptPasswordHasher` : round-trip hash/verify.

Le `OnboardingGate` reste testé manuellement (UI). Pas de test E2E (out of scope POC).

---

## 8. Frontière (always / ask first / never)

### Toujours faire

- Respecter la DAG de `CLAUDE.md` § "Layer DAG". `pnpm dep:check` vert à chaque slice.
- Tout nouveau champ utilisateur passe par Zod côté API (`parseBody` de `shared/api/parse.ts`).
- Les handlers HTTP utilisent `withRoute(handler)` ; les erreurs sont **levées**, jamais retournées.
- Hash password avec coût ≥ 10.
- Les routes `app/(with-sidebar)/**` redirigent vers `/login` si pas de session.

### Demander avant

- Toute modif de la signature de `getCurrentUser` consommée ailleurs dans le code.
- Toute extension des champs `User` au-delà de ceux listés en §3.
- Ajout d'un 3ème provider (GitHub, Apple…).
- Toute modif des règles de ranking du feed (les affinités sont déjà branchées, n'y touche pas).

### Ne jamais faire

- Ne pas stocker de password en clair, même temporairement (log, error message…).
- Ne pas exposer `passwordHash` dans un DTO ou une réponse API.
- Ne pas importer `next-auth` directement depuis `modules/<cap>/domain` ou `application/` — passe par les ports.
- Ne pas mettre de logique métier dans `app/api/**/route.ts` — uniquement `withRoute(handler)` + appel use case.
- Ne pas ré-introduire le pattern singleton caché (`let cached: CurrentUser` dans `current-user.ts`).
- Ne pas commiter `AUTH_SECRET` ni les `AUTH_GOOGLE_*` (les ajouter à `.env.local`, mettre `.env.example` à jour).

---

## 9. Découpage en slices vérifiables

Chaque slice se termine par `pnpm type-check && pnpm dep:check && pnpm test` vert.

| # | Slice | Verify |
|---|---|---|
| A | Migration Prisma : Account, Session, VerificationToken + User additions + backfill `onboardedAt` pour seed user. | `pnpm prisma:validate`, `pnpm db:migrate`, seed re-run OK. |
| B | `modules/auth/domain` + `application` + `infra` (use cases + BcryptPasswordHasher + PrismaAuthUserRepository) + tests unitaires. | `pnpm test` vert sur les nouveaux tests. |
| C | `shared/auth/auth.ts` (Auth.js v5 config), `app/api/auth/[...nextauth]/route.ts`, env vars, `getCurrentUser` réécrit. | Démarrer `pnpm dev`, hit `/api/auth/session` retourne `null` en non-authentifié. |
| D | `app/(auth)/login/page.tsx` + `SignInForm` + `GoogleSignInButton` + `api/auth/register/route.ts`. | Signup credentials → user créé en DB + session active. Signin Google → user créé via adapter. |
| E | `(with-sidebar)/layout.tsx` redirige si pas de session ; `OnboardingGate` monté ; `ProfileFormModal` rendu en mode bloquant si `onboardedAt === null`. | Nouveau user voit la popup au premier `/`. |
| F | `PrismaProfileRepository` remplace `MockProfileRepository` ; `UpdateProfileUseCase` ; `PATCH /api/profile`. Bouton `Sign out` + bouton `Edit profile` branché. | Edit profile dans la popup → DB mise à jour. Logout → retour /login. |
| G | Nettoyage `tbd.md` (lignes 20, 37) ; `pnpm build` vert. | Build prod OK. |

Checkpoints utilisateur après C, E, F.

---

## 10. Risques identifiés

| Risque | Mitigation |
|---|---|
| Auth.js v5 est encore en beta (`next-auth@5.0.0-beta.x`) — API peut bouger | Lock la version exacte dans `package.json`. |
| Le DAG `domain ne dépend pas de l'infra` est tendu avec Auth.js dont la config (`authConfig.ts`) référence `PrismaAdapter(prisma)`. | `authConfig.ts` vit en `infra/` (ou `shared/auth/`), pas en domain. Les use cases ne l'importent jamais. |
| Migration nullable de `gender`/`birthDate` casse les types côté UI qui supposent une valeur. | Audit des consommateurs avant la migration (slice A) ; fallback UI clair (`"Non renseigné"`). |
| Popup bloquante = mauvaise UX si l'API échoue. | Toast erreur clair + retry, mais on garde la popup ouverte. |
