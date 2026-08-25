# Wandr — mobile

Expo (SDK 57) client for Wandr, using expo-router for file-based navigation. Standalone from the Next.js web app: it never imports `src/**` and only shares pure TypeScript via `@wandr/shared` (contracts, presets, core types).

## Develop on a LAN device (Expo Go)

A physical phone can't reach `localhost`, so the Next.js API has to be bound to your machine's LAN IP and every URL pointed at it. Find that IP first (Windows: `ipconfig` → IPv4 Address; macOS/Linux: `ipconfig getifaddr en0` or `hostname -I`) — call it `<IP-LAN>` below.

1. **Root `.env`** (repo root, copy from `.env.example` if you don't have one) — point Better Auth at the LAN IP instead of `localhost`:
   ```
   BETTER_AUTH_URL=http://<IP-LAN>:3000
   NEXT_PUBLIC_BETTER_AUTH_URL=http://<IP-LAN>:3000
   ```
2. **`apps/mobile/.env`** (copy from `apps/mobile/.env.example`):
   ```
   EXPO_PUBLIC_API_URL=http://<IP-LAN>:3000
   ```
3. **Start the web app bound to all interfaces**, from the repo root:
   ```
   pnpm dev:lan
   ```
   (runs `next dev -H 0.0.0.0`, so it's reachable from the LAN, not just `localhost`.)
4. **Start Expo**, from `apps/mobile`:
   ```
   npx expo start
   ```
   Scan the QR code with **Expo Go** on a phone connected to the *same Wi-Fi network* as your machine.
5. **Sign in** with a seeded user (`SEED_USER_EMAIL` / `SEED_USER_PASSWORD` from the root `.env`, after `pnpm db:seed`). Chat is gated behind `User.isPremium` — flip that column to `true` for the seed user in the DB (e.g. via Prisma Studio: `npx prisma studio` at the repo root) to unlock it; otherwise the chat tab routes to `/premium-required`.

Local (non-LAN) development without a device — `pnpm --filter wandr-mobile start` or `pnpm start` from `apps/mobile` — still works against `localhost` via a simulator, without any of the above.

### Known limitations

- **No map.** The web's MapLibre explorer is Phase 2 (`@maplibre/maplibre-react-native`) — mobile has no map surface today.
- **No offline support.** TanStack Query has no persistence layer wired; losing connectivity mid-session shows the existing error/retry states, nothing is cached for offline use.

## Structure

- `app/` — expo-router routes: `(tabs)` holds the 5-tab shell (Accueil, Explorer, Calendrier, Chat, Profil), `activity/[slug]` is the modal activity detail screen.
- `src/theme/tokens.ts` — Warm Editorial design tokens (colors, spacing, radius, type scale, shadow), ported from the web's `globals.css`.
- `src/ui/` — `AppText`, `Icon` (SVG icon set ported from the web's hand-drawn icon system), `Screen` (safe-area + padded surface).
- `assets/brand/rose.svg` — static port of the web's `AffinityRose` mark (no scan/converge animation). `assets/icon.png`, `assets/adaptive-icon.png` and `assets/splash-icon.png` are rasterized from it (`assets/brand/*-source.svg`) via `resvg-cli`; regenerate with `npx --yes resvg-cli <source>.svg <out>.png --fit-width <n> --fit-height <n>` if the mark changes.

## Verify

```
pnpm mobile:type-check   # from repo root
cd apps/mobile && npx expo lint
```
