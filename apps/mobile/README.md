# Wandr — mobile

Expo (SDK 57) client for Wandr, using expo-router for file-based navigation. Standalone from the Next.js web app: it never imports `src/**` and only shares pure TypeScript via `@wandr/shared` (contracts, presets, core types).

## Develop

From the repo root:

```
pnpm install
pnpm --filter wandr-mobile start
```

Or from `apps/mobile`: `pnpm start` (then `a`/`i`/`w` to open Android/iOS/web).

To reach the Next.js API from a device on the same network, run the web app with `pnpm dev:lan` at the repo root and set `EXPO_PUBLIC_API_URL` in `.env` (see `.env.example`) to your machine's LAN IP.

## Structure

- `app/` — expo-router routes: `(tabs)` holds the 5-tab shell (Accueil, Explorer, Calendrier, Chat, Profil), `activity/[slug]` is the modal activity detail screen.
- `src/theme/tokens.ts` — Warm Editorial design tokens (colors, spacing, radius, type scale, shadow), ported from the web's `globals.css`.
- `src/ui/` — `AppText`, `Icon` (SVG icon set ported from the web's hand-drawn icon system), `Screen` (safe-area + padded surface).

## Verify

```
pnpm mobile:type-check   # from repo root
cd apps/mobile && npx expo lint
```
