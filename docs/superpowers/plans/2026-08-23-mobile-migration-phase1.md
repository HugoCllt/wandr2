# Wandr Mobile Phase 1 (Expo) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer une app mobile-first Expo (iOS/Android) cliente des routes `/api` existantes de Wandr, avec un design system Warm Editorial repensé pour le mobile — sans toucher au comportement du web.

**Architecture:** Le backend Next 14 (racine du repo) reste l'unique seam HTTP ; `apps/mobile` (Expo Router) est un pur client HTTP ; `packages/shared` (nouveau, TS pur) porte contracts + presets + leur fermeture de types, consommé par les deux. Aucune règle métier ne bouge. Lecture B phasée : le design mobile devient canonique, le réalignement web est hors scope Phase 1.

**Tech Stack:** Expo SDK dernière stable (54+), Expo Router, TypeScript strict, StyleSheet + tokens TS (pas de NativeWind/Tamagui), TanStack Query, better-auth `@better-auth/expo`, `expo/fetch` (streaming NDJSON), `@gorhom/bottom-sheet`, `react-native-reanimated`, `expo-image`, `react-native-svg`.

**Spec:** `MOBILE_MIGRATION.md` (faisabilité) + section « Décisions actées » ci-dessous (verdicts d'architecture rendus le 2026-08-23). Le plan argumente depuis ces deux sources.

## Global Constraints

- **POC solo, une ville (Montréal), une locale (copy UI en français)** — pas de i18n, pas de multi-tenant.
- **Aucun commentaire dans le code** (règle utilisateur absolue, web comme mobile).
- **Commits directs sur `main`**, un commit par tâche, message `feat(mobile): …` / `feat(server): …` / `chore(workspace): …`, terminé par `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- **Rituel de vérification après chaque tâche** : `pnpm type-check && pnpm dep:check && pnpm test` (web intact) + `pnpm mobile:type-check` (dès T3). `pnpm build` avant le commit final de T11 uniquement (échoue si `next dev` tourne — contention `.next`, pas votre diff).
- **`apps/mobile` n'importe JAMAIS `src/**`** — uniquement `@wandr/shared` et ses propres fichiers. Règle dep-cruiser `mobile-no-src` (T2).
- **Liste de dépendances mobile fermée** (voir T3). Toute dep hors liste = l'ajouter au rapport final de la tâche avec justification d'une ligne.
- **Palette et identité : Warm Editorial** — source de vérité `src/app/globals.css` `:root` (le `DESIGN.md` racine est OBSOLÈTE — ancienne identité Inter/orange, ne pas s'en servir).
- **Serveur : zéro régression web.** Chaque changement serveur est additif (plugin, header prioritaire, nouvelles routes GET). Le flux cookie web ne change pas.
- **Avant toute tâche UI mobile (T5–T11), lire** `.claude/skills/impeccable/reference/craft-floor.md` (plancher de qualité visuelle) — obligatoire.
- **Windows** : shell PowerShell ; `prisma generate` peut EPERM si un dev server tourne (bénin, les types se régénèrent quand même).

---

## Décisions actées (2026-08-23)

| # | Sujet | Décision |
|---|---|---|
| Q2 | Repo | Next reste à la racine, intouché. Ajout `apps/mobile` + `packages/shared` (contracts + presets + fermeture de types purs). pnpm workspace, `node-linker=hoisted`. Stubs de ré-export aux anciens chemins — zéro réécriture d'imports dans `src/`. |
| Q3 | Styling RN | `StyleSheet` + module de tokens TS (`theme/tokens.ts`). Ni NativeWind ni Tamagui. |
| Q4 | Auth | Plugin `expo()` better-auth serveur + `expoClient` avec `expo-secure-store`. Email/password natif + Google OAuth par deep link, scheme `wandr://`. |
| Q5 | Versioning API | Différé (entrée tbd.md : versionner avant toute distribution externe). |
| Q6 | CORS | Aucun (fetch natif = pas d'Origin). Seul ajout : `trustedOrigins: ['wandr://']`. |
| Q7 | Ville active | Header `x-wandr-city` prioritaire : header → cookie `wandr_city` → ville profil → `montreal`. Pas de city switcher mobile en V1. |
| Q8 | Chat streaming | `expo/fetch` + protocole NDJSON inchangé. Pas de fallback SSE en V1. |
| Q9 | Data layer | TanStack Query sans persistance offline. Feed = `useInfiniteQuery` + `FlatList.onEndReached`. |
| Q10 | Carte | Hors Phase 1. Détail = adresse + « Ouvrir dans Plans » (`Linking`). Phase 2 : `@maplibre/maplibre-react-native`. |
| Q11 | Navigation | Expo Router, 5 tabs : Home, Explore (hub 6 catégories → `explore/[category]`), Calendar, Chat, Profile. Détail = écran `presentation: 'modal'`. Login hors tabs. Favoris = écran poussé depuis Profile. |
| Q12 | Pliables | `useWindowDimensions` : 1 colonne < 600 dp, 2 colonnes ≥ 600 dp. |
| Q13 | Ordre | scaffold+theme → auth → feed → détail → favoris+calendrier → filtres → chat. ChatGate : garde serveur inchangée, pas d'upsell mobile — écran message simple sur 403 premium. |
| Q14 | BYOK | Chantier séparé, hors migration. |
| Q15 | Dev réseau | LAN : `EXPO_PUBLIC_API_URL=http://<IP-PC>:3000`, `next dev -H 0.0.0.0`, Postgres local. Hébergement différé. |
| Q16 | Dark mode | Non. `"userInterfaceStyle": "light"`. Tokens nestés (`theme.colors.*`) pour qu'un dark set Phase 2 soit un ajout. |
| Q17 | Stack | SDK 54+, liste fermée (T3). |
| Q18 | Garde-fous | `mobile:type-check` + `expo lint` + règle dep-cruiser `mobile-no-src`. Pas de vitest mobile. |

---

## Design language mobile — « Warm Editorial, au doigt »

Mode (impeccable) : **Operate** pour l'app entière ; touches **Experience** sur le hero Home et le chat. La marque vit dans la précision des détails, pas dans la décoration.

### Tokens (valeurs exactes, source `globals.css`)

Couleurs : `offwhite #F6F1E8` (fond app), `surface #FFFFFF`, `surface2 #FBF7F0`, `surface3 #EFE8DB`, `ink #1E1A16` (texte + tab bar), `smoke #7A7064` (texte secondaire), `silver #CFC6B7`, `line #E7DFD2` (bordures), `brass #C68A3A` (accent primaire, actif, CTA), `brass700 #A06E2A`, `brassTint #F3E4CC`, `teal #11605E` (secondaire, liens discrets), `live #D8453F` (badge « En direct » uniquement).

Typographie : **Libre Bodoni** (display — titres d'écran, titres de cards hero, chiffres du calendrier) + **Public Sans** (tout le reste). Échelle mobile : `display 30/34 (600)`, `title 22/26 (600)`, `subtitle 17/22 (500)`, `body 15/21 (400)`, `caption 12/16 (500, letterSpacing 0.4, uppercase pour les eyebrows)`.

Espacement 4-pt : `s1 4, s2 8, s3 12, s4 16, s5 24, s6 32, s7 40, s8 48`. Gouttière d'écran : `s4` (16). Radius : `card 12, btn 9, sm 7, pill 999`. Ombres : iOS `shadowColor ink, opacity 0.08, radius 12, offset {0,4}` / Android `elevation 3` (cards) ; jamais d'ombre sur les surfaces posées sur `offwhite` sans image.

### Traductions web → mobile (fermes)

- **Nav sticky ink** → **tab bar ink** (`#1E1A16`), icônes du système maison, inactif `silver`, actif `brass`, labels Public Sans 11. Safe-area gérée. Headers d'écran : fond `offwhite`, titre Libre Bodoni, sans bordure (hairline `line` au scroll).
- **FeaturedHero parallaxe Lenis** → carrousel horizontal paged (`FlatList` horizontal + `pagingEnabled`), image plein bleed ratio 16:10, scrim dégradé ink 0→60%, eyebrow caption brass, titre Libre Bodoni 30 sur image, dots « you-are-here ». Parallaxe légère au scroll vertical via Reanimated (`interpolate` sur `onScroll`), amplitude ≤ 24 dp. Pas de Lenis-like global.
- **Masonry 3 colonnes** → **1 colonne** (< 600 dp) de `CoverCard` plein largeur ratio 4:3 ; **2 colonnes** ≥ 600 dp (ratio 4:3.4). Pas de cartes raccourcies, pas de parallaxe par colonne.
- **Actions au hover** → toujours visibles : pastilles 36 dp (cœur, signet) en haut-droite de la card, fond `rgba(30,26,22,0.35)`, icône blanche, **haptique `Light`** au toggle.
- **Radix Popover (filtres, Explore)** → `@gorhom/bottom-sheet` (fond `surface2`, handle `silver`, coins 20 dp).
- **ActivityModal plein écran** → écran `activity/[slug]` en `presentation: 'modal'`, image hero 4:3, contenu scrollable, barre d'action sticky en bas (favori, signet, « Ouvrir dans Plans », lien externe).
- **RouteSplash / AffinityRose** → hors V1 (splash natif statique : rose brass sur crème). Entrée tbd.md.
- **Press feedback** : `Pressable` + scale 0.98 / opacité 0.92, 120 ms. Pull-to-refresh teinté `brass`. `prefers-reduced-motion` → `useReducedMotion()` de Reanimated coupe parallaxe et marquee.
- **Copy** : français partout (le web mêle FR/EN ; le mobile est 100 % FR — réutiliser les libellés FR existants : « Pour toi », « D'autres ont aussi aimé », « Coup de cœur », « Tendance », « En direct », « Gratuit »).

### Structure de fichiers cible

```
packages/shared/
  package.json            ("name": "@wandr/shared", "main": "./src/index.ts", deps: zod)
  tsconfig.json
  src/index.ts            (barrel racine — exporte tout)
  src/contracts/…         (ex-src/shared/contracts, inchangés sauf imports)
  src/presets/…           (ex-src/shared/presets, inchangés sauf imports)
  src/core/…              (fermeture de types purs extraits du domain : ActivityKind,
                           ActivityStatus, ActivityCategory(Set), FilterValue+schemas, IconName)
apps/mobile/
  package.json  app.json  metro.config.js  tsconfig.json  .env.example
  src/theme/tokens.ts     src/theme/useFeedColumns.ts
  src/lib/api.ts          src/lib/auth-client.ts   src/lib/city.ts   src/lib/streamNdjson.ts
  src/lib/queries/{useFeed,useActivity,useFavorites,useCalendar,useProfile,useFacets}.ts
  src/ui/{AppText,Screen,Button,Chip,IconButton,Icon,PriceLabel,Badge}.tsx
  src/components/{CoverCard,ImagelessCard,HeroCarousel,CardActions,FilterSheet,…}.tsx
  app/_layout.tsx         app/(auth)/login.tsx     app/onboarding.tsx
  app/(tabs)/_layout.tsx  app/(tabs)/{index,calendar,chat,profile}.tsx
  app/(tabs)/explore/{index,[category]}.tsx
  app/activity/[slug].tsx app/favorites.tsx        app/premium-required.tsx
```

---

## Orchestration multi-agents

Exécution **séquentielle** T1 → T11 (un agent Sonnet frais par tâche, même repo, commits sur `main`). Pas de parallélisme : les tâches partagent `apps/mobile` et l'historique git. Chaque agent : (1) lit les fichiers « Sources de vérité » de sa tâche, (2) exécute les étapes, (3) lance le rituel de vérification, (4) commit, (5) rapporte ce qui dévie du plan. L'orchestrateur relit le diff entre chaque tâche.

---

### Task 1: Workspace pnpm + `packages/shared`

**Files:**
- Modify: `pnpm-workspace.yaml` (ajouter `packages:`), `package.json` racine (nom `wandr-web` inutile — ne pas renommer ; ajouter dep workspace), `next.config.mjs` (`transpilePackages: ['@wandr/shared']`), `.npmrc` (créer si absent : `node-linker=hoisted`)
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`, `packages/shared/src/{contracts,presets,core}/**`
- Modify: chaque fichier de `src/shared/contracts/*` et `src/shared/presets/*` devient un **stub de ré-export** ; les fichiers domain dont un type pur est extrait ré-exportent depuis `@wandr/shared`

**Interfaces:**
- Produces: package `@wandr/shared` importable par Next et Metro ; exports nommés identiques aux exports actuels de `src/shared/contracts/*`, `src/shared/presets/*`, plus `ActivityKind`, `ActivityStatus`, `ActivityCategory`, `ActivityCategorySet`, `FilterValue`, `FilterValueSchema`, `DatePresets`, `isDateRange`, `IconName`.
- Sources de vérité : `src/shared/contracts/`, `src/shared/presets/`, `src/modules/activities/domain/Activity.ts`, `src/modules/activities/domain/ActivityCategorySet.ts`, `src/modules/filters/domain/FilterValue.ts`, `src/shared/ui/icons/Icon.tsx` (type `IconName`), `.dependency-cruiser.cjs`, `tsconfig.json`.

- [ ] **Step 1 : déclarer le workspace.** Dans `pnpm-workspace.yaml`, ajouter en tête :

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Créer `.npmrc` racine avec `node-linker=hoisted`.

- [ ] **Step 2 : créer le package.**

```json
{
  "name": "@wandr/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": { "zod": "^4.4.3" }
}
```

`tsconfig.json` du package : `strict: true`, `moduleResolution: "bundler"`, `noEmit: true`, `target: ES2022`.

- [ ] **Step 3 : déplacer par fermeture transitive.** Copier `src/shared/contracts/*` → `packages/shared/src/contracts/`, `src/shared/presets/*` → `packages/shared/src/presets/`. Lancer `pnpm --filter @wandr/shared exec tsc --noEmit` ; chaque import restant vers `src/**` désigne un type à extraire dans `packages/shared/src/core/` (attendus : `ActivityKind`, `ActivityStatus` depuis `Activity.ts` ; `ActivityCategory`/`ActivityCategorySet` + schemas ; `FilterValue` + `FilterValueSchema` + `DatePresets` + `isDateRange` + `DateFilter` ; type `IconName` — extraire l'union de noms depuis `Icon.tsx` dans `core/IconName.ts`, le composant React reste dans `src/shared/ui`). **Seuls des types, constantes et schémas Zod purs bougent — jamais une règle métier, jamais du React.** Itérer jusqu'à ce que le package compile sans référence à `src/**`.
- [ ] **Step 4 : stubs aux anciens chemins.** Chaque fichier déplacé ou amputé garde son chemin d'origine sous forme de ré-export nommé, ex. `src/shared/contracts/ActivityDTO.ts` :

```ts
export type { ActivityDTO } from '@wandr/shared';
```

et `src/modules/activities/domain/Activity.ts` conserve son contenu restant + ré-exporte les types extraits (`export type { ActivityKind, ActivityStatus } from '@wandr/shared';`). Ajouter `@wandr/shared: workspace:*` aux deps du `package.json` racine ; `transpilePackages: ['@wandr/shared']` dans `next.config.mjs`.

- [ ] **Step 5 : vérifier.** `pnpm install` puis `pnpm type-check && pnpm dep:check && pnpm test`. Attendu : tout vert, zéro modification de comportement. Si dep-cruiser râle sur les stubs, ajuster la config en conservant l'intention des règles (le rapporter).
- [ ] **Step 6 : commit** `chore(workspace): extract @wandr/shared (contracts+presets+core types)`.

### Task 2: Serveur mobile-ready

**Files:**
- Modify: `src/shared/auth/auth.ts` (plugin expo + trustedOrigins), `src/modules/activities/web/activeCity.ts` (header prioritaire), `package.json` racine (scripts `dev:lan`, `mobile:type-check`), `.dependency-cruiser.cjs` (règle `mobile-no-src`), `tbd.md`
- Create: `src/app/api/profile/route.ts` → ajouter `GET` (le `PATCH` existe), `src/app/api/activities/featured/route.ts` (GET), `src/app/api/neighborhoods/route.ts` (GET), `src/modules/activities/web/resolveCitySlug.ts` + test
- Test: `src/modules/activities/web/resolveCitySlug.test.ts`

**Interfaces:**
- Produces: `GET /api/profile` → `ProfileViewDTO` (réutiliser le loader de `src/modules/profile/web/loadProfileView.ts` via la couche application) ; `GET /api/activities/featured?limit=3` → `ActivityDTO[]` (réutiliser `ListFeaturedActivitiesUseCase`) ; `GET /api/neighborhoods` → `{ items: { name: string; count: number }[] }` (réutiliser le use case des facets de quartier) ; résolution ville : `x-wandr-city` header > cookie `wandr_city` > ville profil > `montreal`.
- Sources de vérité : `src/modules/activities/web/activeCity.ts`, `src/app/api/_lib/withRoute.ts`, `src/shared/api/parse.ts`, `src/modules/profile/web/loadProfileView.ts`, `src/modules/feed/web/feedRoute.ts` (modèle de handler), doc better-auth expo (`@better-auth/expo`).

- [ ] **Step 1 : auth.** `pnpm add @better-auth/expo`. Dans `auth.ts` : `import { expo } from '@better-auth/expo'`, ajouter `plugins: [expo()]` et `trustedOrigins: ['wandr://']` à la config `betterAuth({...})`. Aucune autre modification.
- [ ] **Step 2 : test d'abord — résolution de ville pure.** Écrire `resolveCitySlug.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { resolveCitySlug } from './resolveCitySlug';

describe('resolveCitySlug', () => {
  it('prefers the x-wandr-city header over everything', () => {
    expect(resolveCitySlug({ headerSlug: 'paris', cookieSlug: 'montreal', profileSlug: 'lyon' })).toBe('paris');
  });
  it('falls back header -> cookie -> profile -> montreal', () => {
    expect(resolveCitySlug({ headerSlug: null, cookieSlug: 'lyon', profileSlug: 'paris' })).toBe('lyon');
    expect(resolveCitySlug({ headerSlug: null, cookieSlug: null, profileSlug: 'paris' })).toBe('paris');
    expect(resolveCitySlug({ headerSlug: null, cookieSlug: null, profileSlug: null })).toBe('montreal');
  });
  it('ignores blank header values', () => {
    expect(resolveCitySlug({ headerSlug: '  ', cookieSlug: 'lyon', profileSlug: null })).toBe('lyon');
  });
});
```

- [ ] **Step 3 : run** `pnpm test -- resolveCitySlug` → FAIL (module absent).
- [ ] **Step 4 : implémenter** `resolveCitySlug.ts` (fonction pure, trim + priorité), puis brancher `activeCity.ts` : lire `headers().get('x-wandr-city')` et passer les trois sources à `resolveCitySlug`, en conservant le reste (lookup DB, throw si `montreal` absent).
- [ ] **Step 5 : nouvelles routes GET.** Chacune en `export const GET = withRoute(handler)` + `parseQuery` Zod, `getOptionalUser`/`getCurrentUser` selon la sensibilité (`/api/profile` = session requise ; featured + neighborhoods = anonymes, scopés ville active). Modeler sur `feedRoute.ts`. `dynamic = 'force-dynamic'` comme partout.
- [ ] **Step 6 : scripts + dep-cruiser.** `package.json` racine : `"dev:lan": "next dev -H 0.0.0.0"`, `"mobile:type-check": "pnpm --filter wandr-mobile exec tsc --noEmit"` (le filtre existera à T3 — le script peut échouer poliment d'ici là, c'est acceptable). `.dependency-cruiser.cjs` : règle `mobile-no-src` interdisant `^apps/mobile` → `^src`, et étendre le script `dep:check` à `depcruise --config .dependency-cruiser.cjs src apps` (guard si `apps` absent : créer le dossier vide avec `.gitkeep`).
- [ ] **Step 7 : tbd.md.** Ajouter sous `## Future changes` : versioning `/api/v1` avant distribution externe ; CORS si Expo web ; Neon/Supabase + déploiement avant usage hors LAN ; BYOK OpenRouter chantier autonome ; carte native `@maplibre/maplibre-react-native` Phase 2 ; fallback `react-native-sse` si `expo/fetch` ne streame pas sur un device cible ; persistance offline TanStack ; tests RN Phase 2 ; splash AffinityRose animé mobile.
- [ ] **Step 8 : vérifier** `pnpm type-check && pnpm dep:check && pnpm test` → vert. **Commit** `feat(server): mobile-ready API (expo auth plugin, x-wandr-city, profile/featured/neighborhoods GET)`.

### Task 3: Scaffold Expo + thème + navigation

**Files:**
- Create: `apps/mobile/**` (scaffold complet), `apps/mobile/src/theme/tokens.ts`, `apps/mobile/src/ui/{AppText,Icon,Screen}.tsx`, `apps/mobile/app/(tabs)/_layout.tsx` + 5 écrans placeholder, `apps/mobile/.env.example`, `apps/mobile/README.md`

**Interfaces:**
- Produces: `theme` (objet tokens, export nommé de `src/theme/tokens.ts`) ; `<AppText variant="display|title|subtitle|body|caption">` ; `<Icon name={IconName} size color>` (sous-ensemble d'icônes porté depuis le `switch` SVG web via `react-native-svg` — au minimum : ball, fork, culture, leaf, moon, heart, calendar, chat, profile/user, home, compass/explore, bookmark, flame, pin, clock, arrow, close, check, filter, external) ; `<Screen>` (SafeArea + fond `offwhite` + gouttière 16).
- Sources de vérité : `src/shared/ui/icons/Icon.tsx` (paths SVG à porter tels quels), `src/app/globals.css` `:root` (tokens), `packages/shared/src/presets/CATEGORY_PRESETS.ts`.

- [ ] **Step 1 : scaffold.** Depuis la racine : `pnpm create expo-app@latest apps/mobile --template blank-typescript`, puis dans `apps/mobile` installer via `npx expo install` : `expo-router react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated expo-image expo-font @expo-google-fonts/libre-bodoni @expo-google-fonts/public-sans expo-secure-store @react-native-async-storage/async-storage expo-haptics expo-web-browser expo-linking expo-constants expo-status-bar react-native-svg` et `pnpm add @tanstack/react-query @gorhom/bottom-sheet better-auth @better-auth/expo @wandr/shared@workspace:*`. Nom du package : `wandr-mobile`. `app.json` : `"name": "Wandr"`, `"scheme": "wandr"`, `"userInterfaceStyle": "light"`, plugin `expo-router`, `"newArchEnabled": true`.
- [ ] **Step 2 : metro monorepo.** `metro.config.js` :

```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
module.exports = config;
```

- [ ] **Step 3 : tokens.** `src/theme/tokens.ts` :

```ts
export const theme = {
  colors: {
    offwhite: '#F6F1E8', surface: '#FFFFFF', surface2: '#FBF7F0', surface3: '#EFE8DB',
    ink: '#1E1A16', smoke: '#7A7064', silver: '#CFC6B7', line: '#E7DFD2',
    brass: '#C68A3A', brass700: '#A06E2A', brassTint: '#F3E4CC',
    teal: '#11605E', live: '#D8453F', scrim: 'rgba(30,26,22,0.35)', white: '#FFFFFF',
  },
  space: { s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 32, s7: 40, s8: 48 },
  radius: { card: 12, btn: 9, sm: 7, pill: 999, sheet: 20 },
  type: {
    display: { fontFamily: 'LibreBodoni_600SemiBold', fontSize: 30, lineHeight: 34 },
    title: { fontFamily: 'LibreBodoni_600SemiBold', fontSize: 22, lineHeight: 26 },
    subtitle: { fontFamily: 'PublicSans_500Medium', fontSize: 17, lineHeight: 22 },
    body: { fontFamily: 'PublicSans_400Regular', fontSize: 15, lineHeight: 21 },
    caption: { fontFamily: 'PublicSans_500Medium', fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  },
  shadow: {
    card: { shadowColor: '#1E1A16', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  },
} as const;
```

- [ ] **Step 4 : primitives + tabs.** `AppText` (map variant→style, couleur par défaut `ink`), `Icon` (port des paths SVG du web, `viewBox` identique, `stroke="currentColor"` → prop `color`), `Screen`. `app/_layout.tsx` : chargement fonts (`useFonts` des deux packages Google Fonts), `GestureHandlerRootView`, `Stack` avec `(tabs)` + `activity/[slug]` en `presentation: 'modal'`. `app/(tabs)/_layout.tsx` : `Tabs` — fond `ink`, `tabBarActiveTintColor: brass`, `tabBarInactiveTintColor: silver`, 5 tabs (Accueil/home, Explorer/compass, Calendrier/calendar, Chat/chat, Profil/user), écrans placeholder « à venir » stylés (fond `offwhite`, `AppText`).
- [ ] **Step 5 : vérifier.** `pnpm install` à la racine, puis `pnpm mobile:type-check` → vert ; `cd apps/mobile && npx expo lint` → vert ; `npx expo export --platform android --output-dir .expo-export-check` → bundle OK (puis supprimer le dossier). Vérifier que `pnpm type-check && pnpm dep:check && pnpm test` (racine) restent verts.
- [ ] **Step 6 : commit** `feat(mobile): scaffold Expo app, Warm Editorial tokens, tab navigation`.

### Task 4: Client API + auth + session gate

**Files:**
- Create: `apps/mobile/src/lib/{api.ts,auth-client.ts,city.ts}`, `apps/mobile/app/(auth)/login.tsx`, `apps/mobile/src/lib/queries/queryClient.ts`
- Modify: `apps/mobile/app/_layout.tsx` (QueryClientProvider + gate session), `apps/mobile/app/(tabs)/profile.tsx` (bouton déconnexion provisoire), `apps/mobile/.env.example` (`EXPO_PUBLIC_API_URL=http://192.168.x.x:3000`)

**Interfaces:**
- Produces: `apiFetch(path: string, init?: RequestInit): Promise<Response>` — préfixe `EXPO_PUBLIC_API_URL`, injecte le cookie de session (`authClient.getCookie()`) et `x-wandr-city` (slug depuis AsyncStorage via `getCitySlug()`, défaut `'montreal'`), lève `ApiError extends Error { status: number }` si `!res.ok` ; `apiJson<T>(path, init?): Promise<T>` ; `authClient` (expoClient scheme `wandr`, storage SecureStore) ; hook `useSession()` ré-exporté.
- Sources de vérité : doc better-auth expo client, `src/modules/auth/web/SignInForm.tsx` (comportements email/password + libellés), `src/shared/auth/auth-client.ts`.

- [ ] **Step 1 : auth-client.**

```ts
import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  plugins: [expoClient({ scheme: 'wandr', storagePrefix: 'wandr', storage: SecureStore })],
});
```

- [ ] **Step 2 : apiFetch + city.** `city.ts` : `getCitySlug()`/`setCitySlug()` sur AsyncStorage, clé `wandr.city`, défaut `montreal`. `api.ts` : voir signature ci-dessus ; header `Cookie: authClient.getCookie()` sur chaque requête.
- [ ] **Step 3 : écran login.** Formulaire email/password (signin + toggle signup, mêmes règles que le web : min 8 caractères), bouton Google (`authClient.signIn.social({ provider: 'google', callbackURL: '/' })`, rendu seulement si le serveur a Google configuré — tenter et afficher l'erreur sinon). Design : fond `offwhite`, logotype « Wandr » Libre Bodoni 34, champs `surface` bordure `line` radius `btn`, CTA plein `brass` texte blanc, erreurs `live`, copy FR (« Se connecter », « Créer un compte », « Adresse courriel », « Mot de passe »).
- [ ] **Step 4 : gate.** `app/_layout.tsx` : `useSession()` ; non connecté → `Redirect` vers `(auth)/login` ; connecté → tabs. Si `user.onboardedAt` absent → `Redirect` vers `/onboarding` (écran placeholder T4, rempli en T8). Déconnexion sur l'onglet Profil (provisoire).
- [ ] **Step 5 : vérifier** `pnpm mobile:type-check` + `npx expo lint` + test manuel documenté dans le rapport : `pnpm dev:lan` + Expo Go, login email/password du seed user (`SEED_USER_EMAIL`), session persistée après kill de l'app. **Commit** `feat(mobile): api client, better-auth expo session, login screen`.

### Task 5: Feed — Home + Explore + catégories

**Files:**
- Create: `apps/mobile/src/lib/queries/{useFeed.ts,useFacets.ts}`, `apps/mobile/src/theme/useFeedColumns.ts`, `apps/mobile/src/components/{CoverCard.tsx,ImagelessCard.tsx,HeroCarousel.tsx,SectionHeader.tsx,FeedList.tsx}`, `apps/mobile/src/ui/{Badge.tsx,PriceLabel.tsx}`
- Modify: `apps/mobile/app/(tabs)/index.tsx` (Home), `apps/mobile/app/(tabs)/explore/index.tsx` (hub), `apps/mobile/app/(tabs)/explore/[category].tsx`

**Interfaces:**
- Consumes: `apiJson`, `theme`, `ActivityDTO` de `@wandr/shared`, `CATEGORY_PRESETS`/`CATEGORY_KEYS`/`isCategoryKey`, `serializeFilters` (si exporté par `@wandr/shared`, sinon construire les params à la main : `kind`, `neighborhood` csv, `date` (`today|weekend|from..to`), `category` csv, `priceMax`, `indoor`, `outdoor`, `free`, `paid` — voir `url-codec.ts`).
- Produces: `useFeed(params: { preset?: CategoryKey; filters: FilterValueDTO })` → `useInfiniteQuery` sur `GET /api/feed?cursor&limit=24&…filtres` (lire `src/modules/feed/web/feedRoute.ts` pour la forme exacte de la réponse `{ items, nextCursor }` — la vérifier, ne pas la supposer) ; `CoverCard({ activity, onPress, actionsSlot })` plein largeur ratio 4:3, image `expo-image` (placeholder blurhash simple ou fond `surface3`), scrim, badge « Tendance »/« En direct », titre Libre Bodoni 22 blanc, meta `date · quartier` Public Sans 12, prix ; `ImagelessCard` (fond dégradé papier `surface2→surface3`, icône catégorie brass, mêmes métas encre) ; `useFeedColumns()` → `{ columns: 1 | 2 }` (< 600 dp → 1).
- Sources de vérité : `src/modules/feed/web/feedRoute.ts`, `src/modules/feed/web/FeedGrid.tsx`, `src/modules/activities/web/cards/{CoverActivityCard,ImagelessActivityCard,helpers,categoryMeta}.tsx|ts`, `src/modules/feed/web/buildFeedSections.ts`.

- [ ] **Step 1 : hooks.** `useFeed` (cursor `getNextPageParam`), requêtes `staleTime: 60_000`. Le fallback image : `imageUrl ?? null` → `ImagelessCard`.
- [ ] **Step 2 : cards.** Respecter le craft-floor. Pastilles d'action injectées via `actionsSlot` (branchées en T7 — d'ici là ne rien afficher).
- [ ] **Step 3 : Home.** `FlatList` (ou `FlashList` si déjà dispo via Expo — sinon FlatList), `numColumns={columns}` + `key={columns}` ; en-tête de liste : salutation (« Ce week-end à Montréal » — nom de ville en dur V1 côté header mobile) + `HeroCarousel` (données `GET /api/activities/featured?limit=3`) + `SectionHeader « Pour toi »` ; pagination `onEndReached` (threshold 0.4) ; pull-to-refresh `brass` ; footer `ActivityIndicator` brass.
- [ ] **Step 4 : Explore.** Hub : grille 2 colonnes de 6 tuiles catégorie (image `heroImage` du preset, scrim, label FR — mapper les labels EN du registry vers le FR via `categoryMeta`-like local : Sport, Gastronomie, Culture, Plein air, Vie nocturne, Romantique), push `explore/[category]`. `[category].tsx` : garde `isCategoryKey` (sinon `Redirect` hub), header = eyebrow du preset ({city} → Montréal) + titre FR, feed `useFeed({ preset: key, filters: {} })` — le param `preset` est envoyé tel quel à `/api/feed` (comportement identique au web).
- [ ] **Step 5 : vérifier** rituel complet + test manuel (scroll infini, 2 colonnes en paysage/pliable si testable). **Commit** `feat(mobile): feed home, explore hub, category screens`.

### Task 6: Détail activité

**Files:**
- Create: `apps/mobile/app/activity/[slug].tsx`, `apps/mobile/src/lib/queries/useActivity.ts`, `apps/mobile/src/components/DetailRow.tsx`

**Interfaces:**
- Consumes: `GET /api/activities/[slug]` → `ActivityDTO` ; navigation depuis toute card (`router.push('/activity/' + slug)`).
- Produces: écran modal — image hero 4:3 (`expo-image`) avec bouton fermer, corps scrollable : eyebrow catégorie, titre display, description body, rangées (calendrier : dates formatées FR ; pin : adresse + quartier ; prix : « Gratuit » si `priceMinCents === 0`, « Prix non communiqué » si `null`, sinon fourchette `$` CAD ; indoor/outdoor en chips) ; barre sticky bas (safe-area) : `actionsSlot` favori/signet (T7), « Ouvrir dans Plans » (`Linking.openURL` — iOS `maps:?q=`, Android `geo:lat,lng?q=`), « Site web » si `externalUrl`.
- Sources de vérité : `src/modules/activities/web/ActivityModal/ActivityModal.tsx` (contenu et ordre), `src/modules/activities/web/cards/helpers.ts` (formatage prix/dates).

- [ ] **Step 1 : hook + écran** selon specs ci-dessus, états loading (skeleton `surface3`) et erreur (message FR + bouton réessayer).
- [ ] **Step 2 : vérifier** rituel + navigation card→détail→retour. **Commit** `feat(mobile): activity detail modal screen`.

### Task 7: Favoris + calendrier

**Files:**
- Create: `apps/mobile/src/lib/queries/{useFavorites.ts,useCalendar.ts}`, `apps/mobile/src/components/{CardActions.tsx,AddToCalendarSheet.tsx,ReviewSheet.tsx,MonthGrid.tsx,UpcomingList.tsx}`, `apps/mobile/app/favorites.tsx`
- Modify: `apps/mobile/app/(tabs)/calendar.tsx`, branchement `actionsSlot` dans Home/Explore/Détail

**Interfaces:**
- Consumes: `POST /api/favorites {activityId}` (toggle) ; `GET /api/favorites/feed?cursor` ; `GET /api/calendar?from&to` ; `POST /api/calendar` ; `DELETE /api/calendar?activityId=` ; `DELETE /api/calendar/[id]` ; `PATCH /api/calendar/[id]` (review outcome DONE/MISSED + satisfaction 1-5 + note ≤280) — lire `src/modules/calendar/web/*` et `src/app/api/calendar/**` pour les corps exacts.
- Produces: `CardActions({ activity })` : pastilles cœur + signet, optimistic update (TanStack `onMutate` rollback), haptique `Light`, invalidation `['feed']`, `['favorites']`, `['calendar']` ; `AddToCalendarSheet` (bottom-sheet : date + créneaux 15 min 6h–23h, comme le web) pour les PLACE sans date, ajout direct à `dateStart` pour les EVENT ; écran Calendrier : `MonthGrid` (7 colonnes, Libre Bodoni pour les numéros, points `brass` sur les jours à entrées, états done `teal`/missed `smoke`), `UpcomingList` (prochaines sorties), section « À noter » → `ReviewSheet` (Fait/Raté, satisfaction 1-5 libellés FR « Décevant »→« Inoubliable », note) ; écran Favoris : feed 1 colonne réutilisant `FeedList` + endpoint favoris, accessible depuis Profil.
- Sources de vérité : `src/modules/calendar/web/{BookmarkButton,AddToCalendarDialog,CalendarMonthGrid,CalendarUpcomingList,PendingReviews,ReviewActivityDialog}.tsx`, `src/modules/favorites/web/FavoriteButton.tsx`.

- [ ] **Step 1 : mutations + CardActions** (optimistic, haptics), brancher dans les 3 surfaces.
- [ ] **Step 2 : calendrier + sheets + favoris** selon specs.
- [ ] **Step 3 : vérifier** rituel + parcours manuel complet (favori → visible dans Favoris ; signet EVENT 1-tap ; signet PLACE → sheet ; review → disparaît de « À noter »). **Commit** `feat(mobile): favorites, calendar, bookmark and review flows`.

### Task 8: Profil + onboarding

**Files:**
- Create: `apps/mobile/src/lib/queries/useProfile.ts`, `apps/mobile/src/components/ProfileForm.tsx`
- Modify: `apps/mobile/app/(tabs)/profile.tsx`, `apps/mobile/app/onboarding.tsx`

**Interfaces:**
- Consumes: `GET /api/profile` (T2) ; `PATCH /api/profile` (existant — lire `src/app/api/profile/route.ts` pour le schéma : naissance, genre, bio, affinités par catégorie).
- Produces: écran Profil (avatar DiceBear par `user.id` — même URL builder que `src/shared/ui/avatarUrl.ts`, recopier la logique dans `apps/mobile`, pas d'import src), nom, bio, chips d'affinités (6 catégories, niveau 0-10 → rendu chips `brassTint`/`brass`), raccourcis Favoris + Calendrier, bouton « Modifier le profil » → `ProfileForm` (sheet plein écran), déconnexion `authClient.signOut()`. Onboarding : même `ProfileForm` en mode bloquant (pas de fermeture tant que non soumis), soumission → `PATCH /api/profile` puis retour tabs.
- Sources de vérité : `src/modules/profile/web/{ProfilePage,ProfileFormModal,OnboardingGate}.tsx`.

- [ ] **Step 1 : écran + form + onboarding** selon specs, validation locale identique au web.
- [ ] **Step 2 : vérifier** rituel + parcours manuel. **Commit** `feat(mobile): profile screen, edit form, onboarding gate`.

### Task 9: Filtres — bottom sheet

**Files:**
- Create: `apps/mobile/src/components/FilterSheet.tsx`, `apps/mobile/src/lib/filtersState.ts`
- Modify: `apps/mobile/app/(tabs)/index.tsx`, `apps/mobile/app/(tabs)/explore/[category].tsx` (bouton filtre + badge compteur)

**Interfaces:**
- Consumes: `useFacets` (`GET /api/neighborhoods`), `useFeed` (les filtres deviennent partie de la query key).
- Produces: état filtres local par écran (`useState<FilterValueDTO>`), bouton flottant « Filtres » (pastille ink, icône filter, badge `brass` avec le compte de filtres actifs) ouvrant `FilterSheet` (@gorhom, snap 60 %/90 %) : sections — Type (chips Tous/Événements/Lieux → `kind`), Date (chips Aujourd'hui/Ce week-end + plage custom deux champs date → `date`), Quartiers (chips multi depuis facets → `neighborhood`), Prix (champ numérique « Prix max » → `priceMax`, chips Gratuit/Payant → `free`/`paid`), Intérieur/Extérieur (chips → `indoor`/`outdoor`) ; CTA « Voir les résultats » plein brass, « Réinitialiser » ghost. Les params envoyés à `/api/feed` reproduisent exactement `serializeFilters` (`date=today|weekend|from..to`, csv pour listes).
- Sources de vérité : `src/modules/filters/web/FilterBar/*.tsx`, `src/modules/filters/application/url-codec.ts`, `src/modules/filters/domain/FilterValue.ts`.

- [ ] **Step 1 : sheet + état + branchement** Home et catégorie (les `baseFilters` du preset restent côté serveur via `preset` — ne pas les dupliquer dans l'état local).
- [ ] **Step 2 : vérifier** rituel + manuel (filtre quartier vide le feed proprement — état vide FR « Rien ici pour l'instant »). **Commit** `feat(mobile): filter bottom sheet wired to feed`.

### Task 10: Chat

**Files:**
- Create: `apps/mobile/src/lib/streamNdjson.ts`, `apps/mobile/src/components/{ChatBubble.tsx,ChatRecoCard.tsx,ChatStatus.tsx,ChatInput.tsx}`, `apps/mobile/app/premium-required.tsx`
- Modify: `apps/mobile/app/(tabs)/chat.tsx`

**Interfaces:**
- Consumes: `POST /api/chat/messages` body `{ message, history, context? }` (lire `ChatMessageBodySchema` dans `src/modules/chat/web/chatMessagesRoute.ts` pour la forme exacte), réponse NDJSON `ChatStreamEvent` (`status{phase} → token{text}* → recommendations{items}? → done | error{message}`) ; `ChatRecommendationDTO` de `@wandr/shared`.
- Produces: `streamNdjson(path, body, onEvent: (e: ChatStreamEvent) => void, signal)` — utilise `fetch` de `expo/fetch` (`import { fetch } from 'expo/fetch'`), `res.body.getReader()` + `TextDecoder`, buffer découpé sur `\n` (portage direct de `ChatPage.tsx:172-220`) ; écran chat : thread en `FlatList` inversée (bulles user `surface` bordure `line` / assistant fond `surface2` avatar « W » serif), `ChatStatus` (libellés FR rotatifs par phase : « Wandr réfléchit… », « Wandr lit votre profil… », « Wandr explore le web… », « Wandr compose… ») avec petit loader points brass, cartes reco (image, titre, « pourquoi », lien source via `Linking`), input dock bas (textarea auto-grow, 3 chips contexte « Près de moi / Ce soir / Solo » injectées comme sur le web, envoi bouton brass) ; 403 `PremiumRequiredError` → écran `premium-required` (message FR sobre, pas d'upsell) ; erreurs stream → bulle d'erreur `live` + bouton réessayer ; état vide : suggestions statiques (3 prompts FR) — le marquee d'inspiration est hors V1.
- Sources de vérité : `src/modules/chat/web/{ChatPage,ChatStatusIndicator}.tsx`, `src/shared/contracts/ChatStreamEvent.ts`, `src/modules/chat/web/chatMessagesRoute.ts`.

- [ ] **Step 1 : streamNdjson + écran** selon specs. L'historique est possédé par le client (état React), rejoué à chaque tour, max 50.
- [ ] **Step 2 : vérifier** rituel + manuel (stream token par token visible, abort à la fermeture de l'écran via `AbortController`). **Commit** `feat(mobile): chat with NDJSON streaming and recommendations`.

### Task 11: Finitions + vérification finale

**Files:**
- Modify: `apps/mobile/app.json` (icône + splash : rose 6 branches brass sur fond `#F6F1E8` — générer un PNG simple depuis le SVG `AffinityRose` statique), `apps/mobile/README.md` (setup LAN complet : `pnpm dev:lan`, `BETTER_AUTH_URL`/`NEXT_PUBLIC_BETTER_AUTH_URL` sur l'IP LAN, `EXPO_PUBLIC_API_URL`, seed premium), `MOBILE_MIGRATION.md` (lien vers ce plan + statut « en cours d'exécution »), `tbd.md` (déferrals restants de T3–T10)
- Verify: tout

**Interfaces:** aucune nouvelle.

- [ ] **Step 1 : balayage qualité UI** — une passe bornée (craft-floor) sur les 9 écrans : safe-areas, touch targets ≥ 44 dp, états vides/erreur/chargement partout, contrastes (smoke sur offwhite = secondaire seulement), haptiques présentes sur favori/signet/envoi chat. Corriger en un lot.
- [ ] **Step 2 : vérification complète** : `pnpm type-check && pnpm dep:check && pnpm test && pnpm mobile:type-check` puis `pnpm build` (dev servers éteints). Attendu : tout vert.
- [ ] **Step 3 : commit** `feat(mobile): phase 1 polish, splash, docs` puis rapport final (écarts au plan, deps ajoutées, points durs rencontrés).

---

## Self-review (fait à l'écriture)

- Couverture spec : toutes les décisions Q2–Q18 ont une tâche porteuse ; carte (Q10), BYOK (Q14), versioning (Q5) explicitement hors scope avec entrée tbd.md (T2/T11).
- Types inter-tâches : `apiFetch`/`apiJson` (T4) consommés T5–T10 ; `theme`/`AppText`/`Icon` (T3) consommés partout ; `CardActions` (T7) branché dans les slots laissés par T5/T6 ; `useFeed` (T5) réutilisé par favoris (T7) et filtres (T9).
- Ce que les agents doivent vérifier eux-mêmes (jamais supposer) : forme exacte de la réponse `/api/feed`, corps exacts calendar/chat, schéma PATCH profile — fichiers listés dans chaque tâche.
