# MOBILE_MIGRATION.md — Migration iOS / Android

> **Statut : Phase 1 exécutée (2026-08-23/24)** — plan d'exécution dans [`docs/superpowers/plans/2026-08-23-mobile-migration-phase1.md`](./docs/superpowers/plans/2026-08-23-mobile-migration-phase1.md) (décisions Q2–Q18 actées le 2026-08-23). L'app Expo (`apps/mobile`) couvre login/onboarding, home + hero, explore + 6 catégories, détail activité, favoris, calendrier complet, filtres bottom-sheet, chat en streaming et profil, avec icône/splash `AffinityRose` statiques. Revue finale de branche passée le 2026-08-25 (`aa04bd7..40051cb`, 26 commits) : 31 correctifs vérifiés, 0 régression. Travail restant connu, dans l'ordre d'exécution recommandé : **pipeline EAS** (aucun `eas.json`, ni `android.package`, ni `ios.bundleIdentifier` — l'app n'est aujourd'hui installable que via Expo Go), **carte native** (Q10, §3.1 ci-dessous — c'est elle qui impose `expo prebuild` et met fin au workflow Expo Go), **versioning `/api/v1`** (Q5, préalable à toute distribution store), **Postgres managé + déploiement**, puis **réalignement web** (lecture B). Passe manuelle sur device réel à faire par l'utilisateur. Ce document reste par ailleurs l'analyse de faisabilité d'origine.
> Ce document est l'analyse de faisabilité d'un passage de Wandr (web Next.js) vers les stores mobiles.
> Base analysée : Next 14 App Router, Prisma/Postgres, better-auth, LangGraph + OpenRouter/Ollama, MapLibre.

---

## 1. Ce qui migre, ce qui ne migre pas

Le DAG `web → application → domain` + `infra → domain` garantit qu'**aucune règle métier n'est liée au web**. La surface à réécrire est donc limitée à la couche UI.

| Reste identique | À réécrire |
|---|---|
| `modules/*/domain`, `*/application`, `*/infra` | `modules/*/web` (~44 `.tsx`) |
| `shared/contracts` (DTOs) | `shared/ui` (8 `.tsx`) |
| `shared/presets` (`CATEGORY_PRESETS`, `HOME_PRESET`, …) | `src/app/**` (composition, layouts) |
| `app/api/**/route.ts` + `withRoute` + `handleApiError` | — |
| Prisma, Postgres, `src/mcp/` | — |

Le seam « pages are config » porte tel quel : `CATEGORY_PRESETS` est du TS pur, donc en Expo Router on garde **un seul** `app/[category].tsx` alimenté par le même registry. Ajouter une catégorie reste une entrée de registry.

---

## 2. Options d'UI

**A. Capacitor / PWA wrappée** — le moins cher. Mais perte du SSR (Capacitor veut un bundle statique) et risque réel de rejet Apple sous la règle 4.2 « minimum functionality » pour un wrapper webview sans valeur native. Viable seulement pour un POC TestFlight interne.

**B. Expo (React Native) + backend Next conservé — recommandé.** Le mobile devient un pur client des routes `/api` existantes. Next est déployé (Vercel) et sert l'API pour web + iOS + Android.

**C. Natif (Swift / Kotlin)** — hors scope pour un POC solo.

Structure repo pour l'option B, compatible avec le dep-cruiser actuel :

```
apps/web      → Next.js (src/app + src/app/api)   ← reste le seam HTTP
apps/mobile   → Expo Router
packages/core → domain + application + infra + shared (contracts, presets)
```

---

## 3. Points durs identifiés dans ce repo

1. **`maplibre-gl` + `react-map-gl`** — ne fonctionnent pas en RN. Remplacement : `@maplibre/maplibre-react-native` ou `@rnmapbox/maps`. Poste le plus coûteux : API différente, pas de DOM, style natif.
2. **Auth** — better-auth utilise des cookies de session. En RN il faut passer en **bearer token** ; le plugin `expo` de better-auth stocke le token dans SecureStore. Impacte `shared/auth/auth.ts`, `auth-client.ts`, `require-session.ts`, plus l'ajout de CORS sur `/api`.
3. **Chat en streaming** — `chat/web/chatMessagesRoute.ts` renvoie un `ReadableStream`. Le `fetch` de React Native ne streame pas nativement → utiliser `expo/fetch` (SDK 52+) ou `react-native-sse`.
4. **Animations** — `lenis` (smooth scroll) et les effets de parallaxe de la home sont à refaire en `react-native-reanimated`. Radix (`checkbox`, `popover`) → `@gorhom/bottom-sheet` + composants RN. NativeWind permet de conserver la syntaxe Tailwind.
5. **Images** — `next/image` → `expo-image` ; les `remotePatterns` de `next.config.mjs` deviennent inutiles côté mobile.

**Ordre de migration conseillé :** auth → feed (liste + cartes) → filtres → favoris / calendrier → chat → carte en dernier.

---

## 4. Base de données

Postgres + Prisma restent **côté serveur uniquement**. Prisma ne tourne pas sur un téléphone et le mobile ne parle jamais à la base directement. Ce qui change :

- **Hébergement** — `DATABASE_URL` local doit devenir un Postgres managé (Neon / Supabase / Railway) : un téléphone n'atteint pas `localhost`.
- **Versionner l'API** (`/api/v1/...`) — une app en store ne se met pas à jour instantanément, de vieilles versions restent en circulation. C'est le seul vrai changement d'architecture imposé par les stores.
- **Cache / offline** — optionnel. TanStack Query + persistance AsyncStorage suffit. Une base locale (`expo-sqlite`, WatermelonDB) seulement pour du offline-first : hors scope Phase 1.
- **`src/mcp/`** — inchangé, outil serveur d'ingestion, invisible du mobile.

---

## 5. Chat : clé API utilisateur (BYOK)

**Faisable.** Aujourd'hui `chat/infra/createChatModel.ts` lit uniquement `env`. Le changement :

- modèle `UserLlmCredential` (ou champ chiffré sur `User`), chiffré **AES-256-GCM** avec une clé serveur — la clé ne redescend jamais au client, l'API ne renvoie qu'un booléen « configurée » + les 4 derniers caractères ;
- port `ILlmCredentialRepository` dans `chat/domain`, adapter Prisma dans `chat/infra` ;
- `createChatModel(config)` prend la clé en paramètre ; `SendChatMessageUseCase` résout credential utilisateur → fallback env.

Effet de bord positif : `ChatTokenUsage`, `CHAT_MONTHLY_TOKEN_CAP` et `MonthlyTokenLimitError` deviennent inutiles pour ces utilisateurs, qui paient leur propre consommation.

### « Se connecter à son ChatGPT » — impossible

Un abonnement ChatGPT Plus/Pro et l'API OpenAI sont deux facturations séparées. OpenAI n'expose aucun flux OAuth permettant à une app tierce de consommer le quota Plus d'un utilisateur. Le « Sign in with ChatGPT » existe mais pour des cas cadrés (Codex, apps *dans* ChatGPT), pas pour router les appels d'un backend tiers sur le compte du user.

Alternatives réalistes, par ordre de proximité :

1. **OpenRouter OAuth PKCE** — le plus proche du « connecte ton compte » : l'utilisateur autorise Wandr, on reçoit une clé scopée, il paie sa conso. `createChatModel` gère déjà le baseURL OpenRouter → quelques dizaines de lignes.
2. **Collage manuel d'une clé** OpenAI / Anthropic / OpenRouter dans le profil (le BYOK ci-dessus).
3. **Inverser le sens** — publier Wandr comme MCP server / app ChatGPT pour que le ChatGPT de l'utilisateur interroge le catalogue. `src/mcp/` existe déjà, mais c'est un autre produit, pas la page chat.

---

## 6. Contraintes stores

- **Apple 3.1.1 (IAP)** — le flag `isPremium` existe. Si le premium est vendu dans l'app, Apple impose l'achat in-app (15–30 %). Le BYOK en lui-même ne pose pas de problème (l'utilisateur contracte directement avec le fournisseur LLM), **mais gâter le champ « clé API » derrière le premium rendrait ce premium soumis à l'IAP**.
- **Apple 4.2 (minimum functionality)** — condamne l'option A (wrapper webview) sans fonctionnalités natives (push, géoloc, offline).

---

## 7. Première brique conseillée

Le **BYOK OpenRouter** : utile sur web comme sur mobile, indépendant de la décision de migrer, et limité à quelques fichiers (`chat/domain`, `chat/infra`, `profile/web`, une migration Prisma).
