# PRD — Wandr v0.1 (Home + Calendar foundation)

## Context

Le repo Wandr aujourd'hui ne contient que la documentation : `CLAUDE.md` (engineering guardrails), `ARCHITECTURE.md` (topologie cible), `design.md` (tokens & primitives), `spec.md` (contrat fonctionnel). `src/` est vide, `SCHEMA.md` est vide, les anciens `PRD_Phase1/2/3.md` ont été supprimés au commit `91ddf56`. Ce PRD bootstrappe le projet end-to-end avec un premier cut délibérément petit, après une session de grilling qui a résolu 16 branches du design tree.

Cible de cette première itération :

1. Stand up le squelette modular-monolith (Next.js + Prisma + PostgreSQL local installé sur le système, pas Docker).
2. Construire la **page Home** end-to-end : feed engine ranké, FilterBar 7 filtres, ActivityCard, Activity Detail, hero carousel 3-up, Favorites.
3. Construire la **page Calendar** : Activity → Dialog "Add to calendar" (date + heure + note) → grille mensuelle avec dots sur les jours occupés. Dates passées autorisées (planificateur ET journal).
4. Mix **EVENT/PLACE** dans le catalogue dès la v0.1 (un `Activity.kind` discriminator), avec un filtre `kind` tri-state pour basculer.
5. Personalisation minimale : table `UserCategoryAffinity` seed-only (6 lignes), score 0-10 par catégorie, intégrée au ranker.
6. **Différé** explicitement : map (`F5`), search (`F4`), pages préset Sport/Romantic/Food (`F8.2-F8.4`), trend flame (`F9.2-F9.4`), profile (`F10`), reviews (`F6.3`), similar (`F6.4`), chat (`F11`), personalisation auto (`F12`), `EngagementEvent` (capture-only sans consumer = dette latente, on l'ajoute quand un consumer ship).

Après ce PRD : un PRD-1B ramène map + search + EngagementEvent quand le besoin est clair.

---

## Problem Statement

Moi (single seeded user, POC personnel) n'ai aucune surface fonctionnelle pour découvrir des activités à Montréal ni pour mémoriser celles que je veux faire. Le repo n'est aujourd'hui que des docs. J'ai besoin d'un premier slice petit et honnête : un feed Home navigable et filtrable qui mélange événements datés et lieux, une page détail lisible, un cœur pour favoriser, et un calendrier où je peux mettre une activité à une date+heure précise pour ne pas l'oublier (ou pour me souvenir de l'avoir faite).

## Solution

Une app Next.js à `apps/web` connectée à un PostgreSQL local (service système, pas Docker), organisée en monolithe modulaire selon `ARCHITECTURE.md`. La première itération embarque :

- **Catalogue** seedé de ~30 activités curatées de Montréal : 15 EVENT (festivals, concerts, expos datées) + 15 PLACE (restos, parcs, lieux permanents). Images Unsplash externes.
- **Page Home `/`** : hero carousel 3-up des `isFeatured=true`, FilterBar sticky 7 filtres (`kind`, `neighborhood`, `date`, `category`, `price`, `indoor/outdoor`, `free/paid`), FeedGrid paginé en cursor opaque, ranker `featured DESC, matchScore DESC, dateStart ASC NULLS LAST, createdAt DESC`.
- **Page Activity Detail `/activity/[slug]`** : hero, description, schedule (EVENT) ou badge "Lieu" (PLACE), pricing, location text, lien externe (booking ou site), bouton heart, bouton "Add to calendar".
- **Page Favorites `/favorites`** : réutilise FeedGrid + FilterBar pour lister/filtrer les activités saved.
- **Page Calendar `/calendar`** : grille mensuelle, dots sur les jours occupés, click jour → liste des entrées triées par heure, removable. Past et future autorisés.
- **Personalisation seed-only** : `UserCategoryAffinity(userId, category, score 0-10)` ; seed le score par catégorie pour le user dev ; le ranker l'utilise.
- **Admin POST endpoint** header-gated pour ajouter des activités sans toucher la DB.

---

## User Stories

### Catalogue & feed
1. Comme user seedé, je veux ouvrir `/` et voir une grille mixte d'événements et de lieux de Montréal, pour savoir ce qui est disponible.
2. Comme user, je veux que chaque carte montre titre, image, catégorie, prix, et soit la date (EVENT) soit un badge "Lieu" (PLACE), pour scanner rapidement.
3. Comme user, je veux voir un hero carousel 3-up en tête de Home avec les activités featured, pour avoir un point d'entrée éditorial.
4. Comme user, je veux que les activités les mieux matchées à mes goûts (catégorie haut score) remontent, pour que le feed soit pertinent.
5. Comme user, je veux que les activités featured remontent même si elles sont dans une catégorie que j'aime peu, pour que la curation puisse outrepasser mes préférences.

### Filtres
6. Comme user, je veux un filtre `kind` tri-state (Tout / Événements / Lieux) en tête de FilterBar, pour cadrer le mix.
7. Comme user, je veux filtrer par neighborhood (Plateau, Mile End, Verdun, Vieux-Port, Petite-Italie, …) en multi-select, pour me concentrer sur un quartier.
8. Comme user, je veux filtrer par date (aujourd'hui / weekend / range custom), et que les PLACE restent visibles (toujours dispo) pendant qu'on filtre les EVENT par leur `dateStart`.
9. Comme user, je veux filtrer par catégorie (SPORT, ROMANTIC, FOOD, CULTURE, OUTDOOR, NIGHTLIFE), pour cibler une humeur.
10. Comme user, je veux filtrer par fourchette de prix, pour cacher ce que je ne peux pas payer.
11. Comme user, je veux des toggles `indoor/outdoor` et `free/paid`, pour dialer la nature de l'outing.
12. Comme user, je veux que tous les filtres actifs vivent dans l'URL (clés plates zod-validées), pour bookmarker, reload, et partager.

### Pagination & détail
13. Comme user, je veux que le feed paginate en cursor (auto-load au scroll quand l'avant-dernière rangée entre dans le viewport), pour ne pas charger tout en une fois.
14. Comme user, je veux cliquer une carte et atterrir sur une page complète `/activity/[slug]` (pas une modale), pour pouvoir lire et partager l'URL.
15. Comme user, je veux voir description, schedule (si EVENT), pricing, location, et un lien externe (booking ou site) sur la page détail, pour avoir tout pour décider.

### Favoris
16. Comme user, je veux un bouton heart sur chaque carte et sur la page détail, pour saver ce qui m'intéresse.
17. Comme user, je veux que mes favoris persistent entre sessions, pour ne rien perdre.
18. Comme user, je veux une page `/favorites` avec FeedGrid + FilterBar, pour relister et refiltrer mes saves.

### Calendar
19. Comme user, je veux un bouton "Add to calendar" sur chaque carte et sur la page détail, ouvrant un Dialog avec date picker + select 15min (06h-23h45) + note 200 char optionnelle, pour planifier.
20. Comme user, je veux pouvoir choisir une date passée comme une date future, pour que le Calendar soit aussi un journal (« j'ai fait Igloofest le 15 février »).
21. Comme user, je veux une page `/calendar` avec grille mensuelle, dots sur les jours occupés, navigation prev/next mois, pour voir mes plans et souvenirs en un coup d'œil.
22. Comme user, je veux atterrir sur le mois courant à l'ouverture, et qu'`aujourd'hui` soit visuellement marqué.
23. Comme user, je veux cliquer un jour pour voir les entrées triées par heure ascendante, pour avoir l'agenda du jour.
24. Comme user, je veux pouvoir supprimer une entrée du calendar, pour corriger une erreur ou annuler.
25. Comme user, je veux pouvoir scheduler la même activité plusieurs fois sur des `scheduledAt` distincts, pour la refaire.
26. Comme user, je veux que `(userId, activityId, scheduledAt)` soit unique pour qu'un double-click sur Save ne crée pas de doublon.

### Dev
27. Comme dev, je veux `pnpm db:seed` idempotent qui upsert ~30 activités + 6 affinities, pour reseed sans nettoyer.
28. Comme dev, je veux `POST /api/admin/activities` gated par `X-Admin-Token`, pour ajouter une activité sans outil DB.
29. Comme dev, je veux `pnpm dep:check` en CI qui enforce le DAG de `CLAUDE.md` §5, pour ne pas pourrir la promesse modulaire.
30. Comme dev, je veux `env` validé via zod au boot, pour fail-fast si `DATABASE_URL` ou `SEED_USER_EMAIL` manquent.
31. Comme dev, je veux pino vers stdout, pour lire le serveur en dev.
32. Comme dev, je veux WCAG AA sur Home / Detail / Favorites / Calendar dès la v0.1, pour que le focus et le clavier soient corrects dès le début.

---

## Implementation Decisions

### Modules construits

| Module | Owns | Notes |
|---|---|---|
| `activities` | `Activity` entity (avec `kind: 'EVENT' \| 'PLACE'`, `dateStart`/`dateEnd`/`neighborhood` nullables), invariants, `IActivityRepository`, `ActivityNotFoundError`, `GetActivityUseCase`, `PrismaActivityRepository` | Invariants : `kind='EVENT'` ⇒ `dateStart` et `dateEnd` non-null et `dateEnd ≥ dateStart` ; `kind='PLACE'` ⇒ `dateStart` et `dateEnd` doivent être null ; `priceMaxCents ≥ priceMinCents` si set ; status ∈ {DRAFT, PUBLISHED, ARCHIVED} ; `category` enum strict. |
| `feed` | `FeedQuery`, `FeedFilter` union, `FeedResult` (cursor-based), `GetFeedUseCase`, ranker pur | Ranker = `rank(activities, affinityMap, now)` fonction pure. Tri : `featured DESC, matchScore DESC, dateStart ASC NULLS LAST, createdAt DESC, id ASC` (le dernier = stabilité du cursor). `matchScore = affinityMap[activity.category] ?? 5` (default neutre si pas d'affinity row). |
| `filters` | Taxonomie typée (7 filtres), zod schemas, sérializeur URL ↔ filter object | Clés plates : `?kind=EVENT&neighborhood=Plateau,Mile-End&date=weekend&category=SPORT,FOOD&priceMax=15&indoor=true&free=true`. Round-trip property test. Composition avec `HOME_PRESET.baseFilters` = pure merge dans `feed.application`. |
| `favorites` | `Favorite` entity, `IFavoriteRepository`, `ToggleFavoriteUseCase`, `ListFavoritesUseCase`, `PrismaFavoriteRepository` | `ListFavoritesUseCase` retourne le même `FeedResultDTO` shape que `GetFeedUseCase` pour réutiliser FeedGrid sur `/favorites`. |
| `calendar` (NEW) | `CalendarEntry` entity, `ICalendarRepository`, `AddToCalendarUseCase`, `RemoveFromCalendarUseCase`, `ListCalendarEntriesUseCase`, `PrismaCalendarRepository` | Invariants : `(userId, activityId, scheduledAt)` unique, `scheduledAt` accepté dans le passé. |
| `affinity` (sub-module dans `activities` ou racine) | `UserCategoryAffinity` entity, `IAffinityRepository`, `GetUserAffinityMapUseCase`, `PrismaAffinityRepository` | Pas d'écriture en v0.1 (seed-only). Le use case retourne `Map<ActivityCategory, number>` injecté dans `GetFeedUseCase`. |

### Cross-cutting

- `shared/auth/current-user.ts` — `getCurrentUser()` cache module-level + lookup via `env.SEED_USER_EMAIL`. Le seul fichier à remplacer le jour où le vrai auth ship.
- `shared/contracts` — `ActivityDTO`, `ActivityCardVM`, `FeedQueryDTO`, `FeedResultDTO`, `FilterValueDTO`, `CalendarEntryDTO`, `CalendarDayVM`.
- `shared/presets` — `HOME_PRESET` uniquement. `visibleFilters: ['kind','neighborhood','date','category','price','indoor-outdoor','free-paid']`, `gridVariant: 'standard'`, `sections: { hero: true, map: false }`.
- `shared/ui` — primitives de `design.md §2` (Button, IconButton, Input, Select, Toggle, Chip, Card, Sheet, Dialog, Skeleton, Carousel) + composées : ActivityCard (variants `hero`, `standard`, `compact`), FilterBar, FeedGrid, PageShell, et nouvelles : CalendarMonthView, CalendarEntryList, AddToCalendarDialog, HeroCarousel.
- `shared/db/prisma.ts` — Prisma client singleton.
- `shared/config/env.ts` — zod loader pour `DATABASE_URL`, `ADMIN_TOKEN`, `SEED_USER_EMAIL`, `SEED_USER_NAME`.
- `shared/obs/logger.ts` — pino → stdout.
- `shared/ui/format/formatInTZ.ts` — seul endroit où la conversion `UTC → America/Toronto` se fait.

### Prisma schema

```prisma
model User {
  id              String           @id @default(cuid())
  email           String           @unique
  name            String
  createdAt       DateTime         @default(now())
  favorites       Favorite[]
  calendarEntries CalendarEntry[]
  affinities      UserCategoryAffinity[]
}

model Source {
  id         String     @id @default(cuid())
  name       String     @unique
  activities Activity[]
}

enum ActivityStatus { DRAFT PUBLISHED ARCHIVED }
enum ActivityKind   { EVENT PLACE }
enum ActivityCategory { SPORT ROMANTIC FOOD CULTURE OUTDOOR NIGHTLIFE }

model Activity {
  id              String            @id @default(cuid())
  slug            String            @unique
  title           String
  description     String
  imageUrl        String
  imageCredit     String?           // ex. "Photo by Jean Dupont on Unsplash"
  kind            ActivityKind
  category        ActivityCategory
  address         String
  neighborhood    String?           // ex. "Plateau-Mont-Royal"
  latitude        Float             // stocké pour le PRD-1B (map), pas utilisé en v0.1
  longitude       Float
  dateStart       DateTime?         // null si kind=PLACE
  dateEnd         DateTime?         // null si kind=PLACE
  priceMinCents   Int               // 0 = gratuit
  priceMaxCents   Int?
  externalUrl     String?           // booking ou site officiel
  indoor          Boolean           @default(false)
  outdoor         Boolean           @default(false)
  isFeatured      Boolean           @default(false)
  status          ActivityStatus    @default(PUBLISHED)
  sourceId        String
  externalId      String?
  source          Source            @relation(fields: [sourceId], references: [id])
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  favorites       Favorite[]
  calendarEntries CalendarEntry[]
  @@unique([sourceId, externalId])
  @@index([status, isFeatured, dateStart])
  @@index([category, dateStart])
  @@index([kind, dateStart])
  @@index([neighborhood])
}

model UserCategoryAffinity {
  id        String           @id @default(cuid())
  userId    String
  category  ActivityCategory
  score     Int              // 0..10, validé en domaine
  updatedAt DateTime         @updatedAt
  user      User             @relation(fields: [userId], references: [id])
  @@unique([userId, category])
}

model Favorite {
  id         String   @id @default(cuid())
  userId     String
  activityId String
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
  activity   Activity @relation(fields: [activityId], references: [id])
  @@unique([userId, activityId])
  @@index([userId, createdAt])
}

model CalendarEntry {
  id          String   @id @default(cuid())
  userId      String
  activityId  String
  scheduledAt DateTime
  notes       String?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  activity    Activity @relation(fields: [activityId], references: [id])
  @@unique([userId, activityId, scheduledAt])
  @@index([userId, scheduledAt])
}
```

### API routes

| Méthode | Route | Use case appelé | DTO retour |
|---|---|---|---|
| `GET` | `/api/feed?cursor=&kind=&neighborhood=&date=&category=&priceMax=&indoor=&free=` | `GetFeedUseCase` | `FeedResultDTO` |
| `GET` | `/api/activities/[slug]` | `GetActivityUseCase` | `ActivityDTO` |
| `POST` | `/api/admin/activities` (header `X-Admin-Token`) | direct repo | `ActivityDTO` |
| `POST` | `/api/favorites` `{ activityId }` | `ToggleFavoriteUseCase` | `{ favorited: boolean }` |
| `DELETE` | `/api/favorites?activityId=` | `ToggleFavoriteUseCase` | `{ favorited: boolean }` |
| `GET` | `/api/favorites?cursor=&...filtres` | `ListFavoritesUseCase` | `FeedResultDTO` |
| `POST` | `/api/calendar` `{ activityId, scheduledAt, notes? }` | `AddToCalendarUseCase` | `CalendarEntryDTO` |
| `DELETE` | `/api/calendar/[id]` | `RemoveFromCalendarUseCase` | `204` |
| `GET` | `/api/calendar?from=&to=` | `ListCalendarEntriesUseCase` | `CalendarEntryDTO[]` |

Tous les errors passent par `app/api/_lib/error-handler.ts` (CLAUDE.md §9). `DomainError` → status typé, jamais de leak Prisma.

---

## Build order — feature par feature

Chaque étape est un slice complet (schema → module → API → UI → tests → verif) que tu peux passer à ton IA séparément. Chaque étape ne dépend que des étapes antérieures.

### Étape 0 — Foundation (infra, pas de feature)

**Goal.** `pnpm install && pnpm type-check && pnpm lint && pnpm dep:check && pnpm prisma validate` tout vert sur une app vide. `pnpm dev` sert un `localhost:3000` minimal.

**Setup.**
- pnpm workspace racine, workspace `apps/web`.
- Next.js 14+ App Router, TS strict, ESLint flat config, Prettier.
- Prisma installé, `apps/web/prisma/schema.prisma` avec datasource pointant `env.DATABASE_URL`.
- `dependency-cruiser` config à `apps/web/.dependency-cruiser.cjs` enforcant CLAUDE.md §5.
- `shared/config/env.ts` zod loader.
- `shared/obs/logger.ts` pino → stdout.
- `shared/db/prisma.ts` singleton.
- `app/layout.tsx` minimal, `app/(home)/page.tsx` placeholder.
- README mini : "Pré-requis : Postgres système installé sur Windows + `createdb wandr_dev` + `.env` avec `DATABASE_URL`."

**Tests.** Aucun.

**Verify.** `pnpm dev` ouvre, `pnpm dep:check` vert, `pnpm prisma validate` vert. Connexion DB testée par `prisma.user.findFirst()` qui répond `null` sans erreur.

---

### Étape 1 — Catalogue & seed (data layer)

**Goal.** DB contient 1 User, 1 Source, 30 Activities (15 EVENT + 15 PLACE, dont 5 featured de chaque kind), 6 UserCategoryAffinity. `pnpm db:seed` idempotent.

**Schema delta.** Models `User`, `Source`, `Activity`, `UserCategoryAffinity` + enums (`ActivityStatus`, `ActivityKind`, `ActivityCategory`).

**Modules.**
- `modules/activities/domain` : `Activity` entity (classe ou type validé), `ActivityNotFoundError`, `IActivityRepository` port.
- `modules/activities/infra/PrismaActivityRepository.ts`.
- `modules/affinity/domain` : `UserCategoryAffinity` entity (validation `score ∈ [0,10]`), `IAffinityRepository`.
- `modules/affinity/infra/PrismaAffinityRepository.ts`.

**Seed (`prisma/seed.ts`).** Upsert :
- 1 User depuis `env.SEED_USER_EMAIL` + `env.SEED_USER_NAME`.
- 1 Source nom = "manual".
- 30 Activities curatées Montréal (titles, descriptions, lat/lng, neighborhood, Unsplash imageUrl + imageCredit). 15 EVENT avec dateStart/dateEnd réels, 15 PLACE avec dates null. 5 de chaque kind ont `isFeatured=true`.
- 6 UserCategoryAffinity pour le user dev : ex. `SPORT=8, FOOD=9, ROMANTIC=3, CULTURE=6, OUTDOOR=7, NIGHTLIFE=4`. (Tu ajustes les valeurs comme tu veux.)

**API.** `POST /api/admin/activities` + handler avec validation `X-Admin-Token === env.ADMIN_TOKEN`, body zod-validé. Slug auto via `slugify` lib + suffixe numérique si collision.

**Tests.**
- `activities/domain/Activity.test.ts` : invariants — `kind=EVENT` exige dates, `kind=PLACE` rejette dates, `dateEnd ≥ dateStart`, `priceMaxCents ≥ priceMinCents`, slug shape (`/^[a-z0-9-]+$/`).
- `affinity/domain/UserCategoryAffinity.test.ts` : score ∈ [0,10], rejette flottants/négatifs/>10.

**Verify.** `pnpm db:seed && pnpm db:seed` (deux fois) → counts identiques. `psql` : `SELECT count(*) FROM "Activity" WHERE kind='EVENT'` = 15. `pnpm test` passe.

---

### Étape 2 — Activity Detail page

**Goal.** Naviguer `/activity/<slug>` rend la page complète : hero, description, schedule (EVENT) ou badge "Lieu" (PLACE), pricing, address, externalUrl. Aucun heart ni "Add to calendar" encore.

**Schema delta.** Aucun.

**Modules.**
- `modules/activities/application/GetActivityUseCase.ts` : prend `slug`, throw `ActivityNotFoundError` si absent.

**API.** `GET /api/activities/[slug]` — appelle use case, mappe `Activity` → `ActivityDTO`.

**UI.**
- `shared/ui/ActivityDetail.tsx` (composant présentationnel consommant `ActivityDTO`).
- `app/activity/[slug]/page.tsx` — server component, fetch via use case, render `ActivityDetail`.
- Layout selon `design.md §4.3`.

**Tests.**
- `activities/application/GetActivityUseCase.test.ts` (mocked `IActivityRepository`) : retourne DTO si trouvé, throw `ActivityNotFoundError` sinon.

**Verify.** Naviguer une URL d'un slug seedé → page rend toutes les infos. URL inconnue → 404 propre via error-handler.

---

### Étape 3 — Filtres (data layer + UI, pas encore branchés au feed)

**Goal.** `parseFilters(url)` et `serializeFilters(values)` round-trip parfait. Composant `<FilterBar />` rendu en isolation (Storybook ou page test) montre les 7 filtres et émet un `FilterValue` typé sur changement.

**Schema delta.** Aucun.

**Modules.**
- `modules/filters/domain` : taxonomie typée `FilterValue = { kind?, neighborhood?, date?, category?, priceMax?, indoor?, outdoor?, free?, paid? }`, zod schemas.
- `modules/filters/application/url-codec.ts` : `parseFilters(searchParams): FilterValue` + `serializeFilters(value): URLSearchParams`. Clés plates, multi-values en CSV (`category=SPORT,FOOD`).

**UI.**
- `shared/ui/FilterBar/FilterBar.tsx` — sticky left ≥ 1024px, collapse en `Sheet` mobile.
- Sous-composants : `KindToggle` (3 chips tri-state), `NeighborhoodFilter` (multi-select chips), `DateFilter` (3 presets + custom range), `CategoryFilter` (multi-select chips), `PriceFilter` (slider ou input `priceMax`), `IndoorOutdoorToggle`, `FreePaidToggle`.

**Tests.**
- `filters/application/url-codec.test.ts` : 10 fixtures + property test `fast-check` round-trip.
- `filters/domain/filter-validation.test.ts` : zod refus de valeurs hors enum.

**Verify.** Charger `/filter-test?kind=EVENT&category=SPORT,FOOD` (page de test temporaire ou Storybook) montre les bons filtres actifs ; toggler une chip met à jour l'URL.

---

### Étape 4 — Feed engine (ranker + use case + API)

**Goal.** `GET /api/feed?cursor=&...filters` retourne `FeedResultDTO` avec items rankés et `nextCursor`. Ranker pure-function testable.

**Schema delta.** Aucun.

**Modules.**
- `modules/feed/domain` : `FeedQuery`, `FeedFilter` union réutilisant `FilterValue` de `filters/domain`, `FeedResult`.
- `modules/feed/application/ranking/p1.ts` : `rank(activities, affinityMap, now): Activity[]` pure. Tri = `featured DESC, matchScore DESC, dateStart ASC NULLS LAST, createdAt DESC, id ASC`. `matchScore = affinityMap.get(activity.category) ?? 5`.
- `modules/feed/application/cursor-codec.ts` : encode/decode base64 du tuple `(featured, matchScore, dateStart, createdAt, id)`. Zod-validé en decode.
- `modules/feed/application/GetFeedUseCase.ts` : compose `HOME_PRESET.baseFilters` + filtres user, query repo, rank, paginate, retourne DTO.
- `modules/affinity/application/GetUserAffinityMapUseCase.ts` : retourne `Map<ActivityCategory, number>` (default 5 si pas de row).

**API.** `GET /api/feed` — parse filtres via `filters` codec, parse cursor, appelle use case, retourne DTO.

**Tests.**
- `feed/application/ranking/p1.test.ts` : tie-breaks (featured > non-featured peu importe matchScore, à matchScore égal le dateStart asc gagne, NULLS LAST, déterminisme sur inputs égaux, EVENT haut-score futur passe devant EVENT bas-score imminent).
- `feed/application/cursor-codec.test.ts` : round-trip property test.
- `feed/application/GetFeedUseCase.test.ts` (mocked repo) : composition filtres avec preset, cursor next page correct, empty result `{ items: [], nextCursor: null }`, filtre `date=weekend` inclut PLACE (Q7).

**Verify.** `curl localhost:3000/api/feed` retourne JSON ranké. `curl ".../api/feed?kind=EVENT"` retourne uniquement EVENT. `curl ".../api/feed?date=weekend"` inclut PLACE et EVENT en weekend.

---

### Étape 5 — Home page composition (sans hero, sans favoris)

**Goal.** `/` rend les 3 colonnes desktop (FilterBar gauche, FeedGrid droite), filters URL-driven, pagination infinie au scroll. Pas encore de hero, pas encore de heart sur les cartes.

**Schema delta.** Aucun.

**Modules.** Aucun nouveau.

**UI.**
- `shared/ui/ActivityCard.tsx` — variantes `standard` et `compact` (le `hero` arrive Étape 6). `standard` montre image, titre, dateLabel/badge "Lieu", priceLabel, catégorie. Pas encore de bouton heart ni "Add to calendar".
- `shared/ui/FeedGrid.tsx` — responsive 3/2/1 cols, IntersectionObserver pour pagination next.
- `shared/ui/PageShell.tsx` — composition root prenant un preset.
- `shared/presets/HOME_PRESET.ts`.
- `app/(home)/page.tsx` — fetch initial server-side, hydrate client.

**Tests.** Pas de test UI à ce stade (per Q-tests du plan : domain + application uniquement).

**Verify.** Ouvrir `/` → ≥ 12 cartes, scroll charge la suite. Toggler un filtre → URL change, feed re-fetch. Reload URL → filtres préservés.

---

### Étape 6 — Hero carousel sur Home

**Goal.** `/` montre un Carousel 3-up des 3 premières activités `isFeatured=true` au-dessus de FilterBar. Auto-rotate, pause-on-hover/focus, respect `prefers-reduced-motion`.

**Schema delta.** Aucun.

**Modules.** Aucun.

**UI.**
- `shared/ui/Carousel.tsx` primitif (per `design.md §2`).
- Variante `hero` de `ActivityCard` (full-bleed image, titre large, description 2 lignes).
- `shared/ui/HeroCarousel.tsx` — wrapper qui fetch les 3 featured et passe au Carousel.
- Mise à jour `HOME_PRESET.sections.hero = true` ; `PageShell` rend `<HeroCarousel />` si `preset.sections.hero`.

**Tests.** Aucun (UI presentational).

**Verify.** Ouvrir `/` → hero visible avec 3 cartes, rotation auto 5s, hover pause, focus pause. `prefers-reduced-motion: reduce` → pas de rotation auto.

---

### Étape 7 — Favoris

**Goal.** Heart fonctionnel sur cartes et page détail. `/favorites` affiche les saves filtrables.

**Schema delta.** Model `Favorite`.

**Modules.**
- `modules/favorites/domain` : `Favorite` entity, `IFavoriteRepository`.
- `modules/favorites/application` : `ToggleFavoriteUseCase`, `ListFavoritesUseCase` (retourne `FeedResultDTO`).
- `modules/favorites/infra/PrismaFavoriteRepository.ts`.

**API.**
- `POST /api/favorites` `{ activityId }` → toggle.
- `DELETE /api/favorites?activityId=` → toggle.
- `GET /api/favorites?cursor=&...filters` → `FeedResultDTO`.

**UI.**
- Bouton heart ajouté à `ActivityCard` (toutes variantes) et à `ActivityDetail`. État serveur via `getCurrentUser()` au render initial. Optimistic UI au click.
- `app/favorites/page.tsx` — réutilise `<PageShell>` avec un preset `FAVORITES_PRESET` (mêmes filtres visibles que Home, gridVariant standard, hero off).

**Tests.**
- `favorites/domain/Favorite.test.ts` : userId/activityId non-vides.
- `favorites/application/ToggleFavoriteUseCase.test.ts` (mocked repo) : add si absent, remove si présent, idempotent sur double-add.
- `favorites/application/ListFavoritesUseCase.test.ts` : retourne shape `FeedResultDTO`, applique les filtres composés.

**Verify.** Cliquer heart sur Home → carte favorisée. Reload → heart persiste. Ouvrir `/favorites` → carte présente, filtre catégorie marche.

---

### Étape 8 — Calendar

**Goal.** Bouton "Add to calendar" partout, Dialog fonctionnel, page `/calendar` avec grille mensuelle et liste par jour.

**Schema delta.** Model `CalendarEntry`.

**Modules.**
- `modules/calendar/domain` : `CalendarEntry` entity, `ICalendarRepository`, `DuplicateCalendarEntryError`.
- `modules/calendar/application` : `AddToCalendarUseCase`, `RemoveFromCalendarUseCase`, `ListCalendarEntriesUseCase` (range `from`/`to`, sorted by `scheduledAt`).
- `modules/calendar/infra/PrismaCalendarRepository.ts`.

**API.**
- `POST /api/calendar` `{ activityId, scheduledAt: ISO, notes? }` → 201 + `CalendarEntryDTO`. Throw `DuplicateCalendarEntryError` → 409.
- `DELETE /api/calendar/[id]` → 204.
- `GET /api/calendar?from=&to=` → `CalendarEntryDTO[]` triés ASC.

**UI.**
- `shared/ui/AddToCalendarDialog.tsx` : `Dialog` + `react-day-picker` (date) + `<select>` natif 15min 06h-23h45 (heure) + `<textarea>` 200 char (note) + boutons Save (primary, disabled tant qu'incomplet) / Cancel (ghost). Toast d'erreur si 409 duplicate.
- Bouton "Add to calendar" sur `ActivityCard` (toutes variantes) et `ActivityDetail`.
- `shared/ui/CalendarMonthView.tsx` : grille 7 colonnes, dot par jour avec ≥ 1 entrée, navigation prev/next mois, "today" highlighted.
- `shared/ui/CalendarEntryList.tsx` : liste tri par `scheduledAt` croissant, montre titre activity + heure formatée Montréal + note + bouton remove.
- `app/calendar/page.tsx` — landing sur le mois courant. Click jour → URL `?day=YYYY-MM-DD` → CalendarEntryList.
- `shared/ui/format/formatInTZ.ts` — helper unique pour `UTC → America/Toronto`.

**Tests.**
- `calendar/domain/CalendarEntry.test.ts` : `scheduledAt` date valide, accepte passé.
- `calendar/application/AddToCalendarUseCase.test.ts` (mocked repo) : succès si nouveau, throw `DuplicateCalendarEntryError` sur clash `(userId, activityId, scheduledAt)`, throw `ActivityNotFoundError` si activity absent.
- `calendar/application/ListCalendarEntriesUseCase.test.ts` : range respecté, tri ascendant.
- `calendar/application/RemoveFromCalendarUseCase.test.ts` : succès, idempotent silencieux si déjà absent.

**Verify.** Cliquer "Add to calendar" sur une carte → Dialog s'ouvre, choisir 2026-06-15 19h30 + note → save → toast confirm. Ouvrir `/calendar`, naviguer juin 2026 → dot sur le 15 → click → entrée listée à 19h30. Re-cliquer "Add" même date+heure → toast d'erreur duplicate. Remove → dot disparaît. Tester avec une date passée → s'affiche aussi.

---

## Testing Decisions

**Ce qui fait un bon test ici** : asserter le comportement externe observable, jamais les internals. Vitest pour unit + integration. Le seul mock autorisé en domain : `Date.now`. Les use cases sont testés avec **fakes en mémoire** (`Map`-backed) implémentant les ports — pas de `vi.mock` de paths.

**Modules testés en v0.1** (per ta sélection : domain + application) :

| Module | Type | Couvre |
|---|---|---|
| `activities/domain` | Unit | Invariants Activity (kind/dates, prix, slug). |
| `affinity/domain` | Unit | Score ∈ [0,10]. |
| `feed/domain` | Unit | FeedQuery validation, cursor decode/encode round-trip. |
| `feed/application/ranking/p1` | Unit | Ranker tie-breaks : featured first, matchScore second, dateStart NULLS LAST, déterminisme. |
| `feed/application/GetFeedUseCase` | Integration (fake repo) | Composition filtres + preset, cursor next page, date+PLACE inclusion (Q7). |
| `filters/application/url-codec` | Unit | Round-trip 10 fixtures + property test fast-check. |
| `favorites/domain` | Unit | Champs requis. |
| `favorites/application` | Integration (fake repo) | Toggle idempotent, list shape. |
| `calendar/domain` | Unit | scheduledAt valide, accepte passé. |
| `calendar/application` | Integration (fake repo) | Add succès/duplicate/activity-not-found, list range+tri, remove silencieux. |

**Pas testés en v0.1** (déféré per ta sélection) : adapters infra contre testcontainers, Playwright. Les CI gates de `CLAUDE.md §11` (`tsc`, `dep:check`, `prisma validate`, `eslint`, `prettier`) couvrent les promesses structurelles.

**Prior art** : aucun — ce PRD pose les conventions (fake repos en mémoire, vitest, pas de `vi.mock`-de-paths, `fast-check` pour property tests).

---

## Further Notes

- **Couche boundary check.** Le piège #1 : importer Prisma types dans `domain`. L'`Activity` entity doit être TypeScript primitif ; le mapping Prisma vit dans `infra`. `dep:check` l'attrape, mais reviewers eyeball aussi.
- **TZ.** Tout en UTC en DB. `formatInTZ.ts` fait `America/Toronto` à l'affichage. DST edge cases acceptés visuellement (off-by-one-hour si la date tombe sur un switch — pas de scope work).
- **Image Unsplash attribution.** `imageCredit` field présent sur Activity. À afficher en petit en pied de carte hero et en pied de page détail. POC privé non publié = OK ; quand tu publies, tu basculeras sur images locales ou storage.
- **Single seed user.** Toutes les colonnes `userId` existent pour future-proofing. v0.1 a un seul user résolu via `getCurrentUser()` qui lit `env.SEED_USER_EMAIL`. Quand le vrai auth ship, seul ce fichier change.
- **Featured + matchScore.** Les deux concepts coexistent : `featured` = veto curatorial per-activity (peut outrepasser une catégorie low-score), `matchScore` = préférence agrégée per-catégorie. Ranker = `featured DESC, matchScore DESC, ...`.
- **Pourquoi folders pas packages.** Per `ARCHITECTURE.md §1.1` : zero ceremony tax until second consumer. Ne promote aucun module en workspace package dans ce PRD.
- **Hors scope explicite (à ne pas implémenter ici)** : map (`F5`), search (`F4`), pages préset Sport/Romantic/Food (`F8.2-F8.4`), trend flame (`F9.2-F9.4`), profile (`F10`), reviews (`F6.3`), similar (`F6.4`), chat (`F11`), personnalisation auto (`F12`), `EngagementEvent`, `pg_trgm`, PostGIS, LLM intent parser, OpenAI, Mapbox token, i18n, Loi 25, managed auth, dark theme, `openingHours` sur PLACE, filtre distance.

---

## Critical files to be created

(Tous les paths relatifs au repo root. Aucun n'existe aujourd'hui.)

- **Setup** : `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/next.config.mjs`, `apps/web/.dependency-cruiser.cjs`, `pnpm-workspace.yaml`, `apps/web/.env.example`.
- **Prisma** : `apps/web/prisma/schema.prisma`, `apps/web/prisma/seed.ts`, `apps/web/prisma/migrations/*`.
- **Pages** : `apps/web/src/app/layout.tsx`, `apps/web/src/app/(home)/page.tsx`, `apps/web/src/app/activity/[slug]/page.tsx`, `apps/web/src/app/favorites/page.tsx`, `apps/web/src/app/calendar/page.tsx`.
- **API routes** : `apps/web/src/app/api/feed/route.ts`, `apps/web/src/app/api/activities/[slug]/route.ts`, `apps/web/src/app/api/admin/activities/route.ts`, `apps/web/src/app/api/favorites/route.ts`, `apps/web/src/app/api/calendar/route.ts`, `apps/web/src/app/api/calendar/[id]/route.ts`, `apps/web/src/app/api/_lib/error-handler.ts`.
- **Modules** : `apps/web/src/modules/activities/{domain,application,infra}/*`, `apps/web/src/modules/affinity/{domain,application,infra}/*`, `apps/web/src/modules/feed/{domain,application}/*` (avec `application/ranking/p1.ts` et `application/cursor-codec.ts`), `apps/web/src/modules/filters/{domain,application}/*`, `apps/web/src/modules/favorites/{domain,application,infra}/*`, `apps/web/src/modules/calendar/{domain,application,infra}/*`.
- **Shared** : `apps/web/src/shared/{auth,contracts,presets,ui,db,config,obs}/*`. Composants UI listés étape par étape ci-dessus.
- **Tests** : `*.test.ts` colocalisés dans `domain/` et `application/` de chaque module.
- **Docs** : `SCHEMA.md` mis à jour pour mirrorer le Prisma schema.

---

## Verification (definition of done global)

1. `pnpm install && pnpm db:migrate && pnpm db:seed` produit DB avec 1 User, 1 Source, 30 Activities (15 EVENT + 15 PLACE), 6 UserCategoryAffinity, 0 Favorite, 0 CalendarEntry.
2. `pnpm type-check && pnpm lint && pnpm format:check && pnpm dep:check && pnpm prisma validate` tout vert.
3. `pnpm test` passe domain + application listés ci-dessus.
4. `pnpm dev` puis manuel :
   - `/` montre hero 3-up + FilterBar + FeedGrid mixte EVENT+PLACE.
   - Toggler `kind=EVENT` → seuls les EVENT, URL contient `?kind=EVENT`. Reload → préservé.
   - Filtre `date=weekend` + `kind=Tout` → EVENT en weekend + tous PLACE.
   - Cliquer une carte → `/activity/<slug>` rendu correct selon kind.
   - Cliquer heart → favori, reload → persistant.
   - Ouvrir `/favorites`, filtrer par catégorie, voir le bon résultat.
   - Cliquer "Add to calendar" depuis carte → Dialog → choisir date+heure → save → toast.
   - Re-add même slot → toast d'erreur duplicate.
   - `/calendar` mois courant, dot sur le jour saved, click → entrée listée, remove → dot disparaît.
   - Tester past date dans le Dialog → accepté, affiché dans la grille.
5. Le PRD est publié à `PRD.md` à la racine du repo dans une PR séparée `docs(prd): wandr v0.1 — home + calendar foundation`. (Le publish réel se fait après approbation du plan et sortie de plan mode.)
