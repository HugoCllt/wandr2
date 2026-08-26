# Wandr

Personal POC — Next.js 14 + Prisma + PostgreSQL, plus an Expo mobile client.

```
.              # Next.js web app + /api (the only HTTP seam)
apps/mobile    # Expo SDK 57 client — pure HTTP client of /api
packages/shared # @wandr/shared — contracts + presets, consumed by both
```

## Prerequisites

- Node.js 20+
- pnpm 10 (`corepack enable`)
- PostgreSQL 15+ running locally
- For mobile: Android Studio (emulator), or the Expo Go app on a phone

## Setup

```sh
# 1. Install deps
pnpm install

# 2. Configure env
cp .env.example .env   # then edit DATABASE_URL to match your local Postgres

# 3. Create the database
createdb -U postgres wandr

# 4. Push schema and seed
pnpm db:push
pnpm db:seed
```

## Run the web app

```sh
pnpm dev          # http://localhost:3000
```

Pages: `/` (home), `/[category]` (sport, dining, culture, outdoor, nightlife, romantic), `/favorites`, `/calendar`, `/chat`, `/profile`, `/login`.

## Run the mobile app

The phone or emulator never reaches `localhost` on your machine, so the API is bound to your LAN IP and every URL points at it. Find the IP once (`ipconfig` → IPv4 Address) — `<IP-LAN>` below.

**1. Point both ends at the LAN IP.** In the root `.env`:

```sh
BETTER_AUTH_URL=http://<IP-LAN>:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://<IP-LAN>:3000
```

In `apps/mobile/.env` (copy from `.env.example`):

```sh
EXPO_PUBLIC_API_URL=http://<IP-LAN>:3000
```

While these point at the LAN IP, browse the **web** app at `http://<IP-LAN>:3000` too — Better Auth compares the request origin to `BETTER_AUTH_URL`, so opening `localhost:3000` fails sign-in with a CSRF error.

**2. Open the firewall once** (PowerShell as administrator):

```powershell
New-NetFirewallRule -DisplayName "Wandr dev" -Direction Inbound -LocalPort 3000,8081 -Protocol TCP -Action Allow
```

**3. Start the API bound to all interfaces**, from the repo root:

```sh
pnpm dev:lan      # next dev -H 0.0.0.0
```

**4. Start Metro**, from `apps/mobile`:

```sh
npx expo start
```

### …on the Android emulator

Launch a device first — Android Studio → *Virtual Device Manager* → ▶, or:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd <AVD-name>
```

Then press **`a`** in the Metro terminal. The CLI installs the Expo Go build matching the project's SDK and launches the app. Check the device is up with `adb devices` if `a` finds nothing.

### …on a physical phone

Install **Expo Go**, put the phone on the *same Wi-Fi* as your machine, and scan the QR code (camera on iOS, in-app on Android).

Caveat on iOS: the App Store ships one Expo Go build, and it must support this project's SDK. When it lags behind, there is no fix from the phone side — use the Android emulator, or a development build. On Android the CLI fetches the matching Expo Go itself, so the problem doesn't arise.

**Signing in:** use the seeded user (`SEED_USER_EMAIL` / `SEED_USER_PASSWORD`, after `pnpm db:seed`). Chat is gated behind `User.isPremium` — flip it to `true` (`npx prisma studio`) or the tab routes to `/premium-required`.

See [`apps/mobile/README.md`](./apps/mobile/README.md) for the mobile app's structure and known limitations.

## Common scripts

```sh
pnpm build            # production build
pnpm test             # vitest
pnpm type-check       # tsc --noEmit (web + @wandr/shared)
pnpm mobile:type-check # tsc --noEmit (apps/mobile)
pnpm lint             # eslint
pnpm dep:check        # enforce layer DAG (src + apps)
```

## Reset DB

```sh
dropdb -U postgres wandr && createdb -U postgres wandr
pnpm db:push && pnpm db:seed
```

See `db_setup.md` for details, `ARCHITECTURE.md` and `CLAUDE.md` for engineering rules.
