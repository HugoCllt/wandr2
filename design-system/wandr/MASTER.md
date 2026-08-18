# Wandr — Design System (Master)

> **Source of truth** for the Wandr UI. Page-specific deviations live in `design-system/wandr/pages/<page>.md` and override this file. Tokens are implemented as CSS custom properties in `src/app/globals.css` (`:root`).

**Direction:** Warm Editorial — a curated Montréal city guide that reads like a print magazine, not a generic SaaS app. Serif display + clean sans body, warm cream paper, deep warm ink, and a single **brass/amber** accent that carries every primary action and active state.

**Identity in one line:** *Brushed-warm editorial — premium, hand-picked, distinctly not blue-SaaS.*

---

## 1. Palette

Implemented as `:root` tokens. Token **names** are inherited from the prior monochrome system so re-theming cascades app-wide; only the **values** shifted cold → warm.

### Accent — Brass / Amber (primary)
| Token | Hex | Use |
|---|---|---|
| `--brass` | `#C68A3A` | Accent base, focus rings, active underline |
| `--brass-700` | `#9C6A28` | Link text on light, borders on brass fills |
| `--brass-600` | `#B0762B` | Hover (darker), gradient stop |
| `--brass-400` | `#D6A258` | Light hover, focus border |
| `--brass-300` | `#E0B877` | Accent on dark surfaces (eyebrows, dots, footer) |
| `--brass-tint` | `#F3E7D0` | Tinted surfaces, active chip bg, selection |
| `--brass-tint-2` | `#EADBBF` | Deeper tint (band gradients) |
| `--grad-brass` | `#D6A258→#C68A3A→#B0762B` | Primary buttons, active pills, send/CTA |
| `--on-brass` | `#FFFFFF` | Text/icon on brass fills |

### Secondary — Deep Teal (sparing)
| Token | Hex | Use |
|---|---|---|
| `--teal` | `#11605E` | Secondary accent, optional category tone |
| `--teal-700` | `#0C4A48` | Teal hover |
| `--teal-300` | `#4E9C99` | Teal on dark |
| `--teal-tint` | `#DCEAE8` | Teal tinted surface |

### Ink (warm near-black)
`--ink #1E1A16` · `--charcoal-900 #171310` · `--charcoal-800 #241F19` · `--charcoal-700 #322B23`
Dark scale: `--ink-950 #100C09` → `--ink-600 #3C332A`

### Surfaces (warm cream paper)
`--offwhite #F6F1E8` (app bg) · `--surface #FFFFFF` · `--surface-2 #FBF7F0` · `--surface-3 #EFE8DB` · `--paper #FAF6EF`

### Warm neutrals (ex-silver)
`--smoke #7A7064` · `--silver #CFC6B7` · `--silver-2 #B7AD9C` · `--silver-100…500` warm stone ramp
Borders: `--line #E7DFD2` · `--line-2 #D8CFC0` · on dark: `--line-dark` / `--line-dark-2` (warm-white alpha)

### Functional
`--live #D8453F` — **only** for LIVE badges. Never a general accent.

---

## 2. Typography

**Pairing:** Magazine Style — Libre Bodoni (display serif) + Public Sans (UI/body).
Loaded via `<link>` in `src/app/layout.tsx`.

| Token | Family | Used by |
|---|---|---|
| `--font-display` | `"Libre Bodoni", Georgia, serif` | h1/h2, hero titles, section heads, card titles, logo |
| `--font-body` | `"Public Sans", ui-sans-serif` | body, nav, buttons, labels, meta |

Scale (existing, kept): hero `56px` / feed head `38px` / section `24–28px` / card title `17–22px` / body `14–15px` / eyebrow `11px` uppercase `0.18–0.22em`.

- Headings: weight 500–700, tight tracking `-0.02 to -0.035em`.
- Eyebrows are the editorial signature: uppercase Public Sans in **brass** (`--brass-300` on dark, `--brass-700` on light).

---

## 3. Accent usage rules

**Brass carries action and "you-are-here".** Apply to:
- Primary buttons / CTAs → `--grad-brass` + `--on-brass` (`.btn-primary`, `.nav-login`, `.chat-send`)
- Active filters (`.filter-pill`, `.filter-bubble`) → brass gradient fill
- Active chips/tabs (`.chip.active`, `.cat-chip.active`) → `--brass-tint` bg + `--brass-700` text
- Active nav link underline → `--brass`
- Section "see all" links → `--brass-700`, hover `--brass-600`
- Carousel/hero active dots → `--brass-300`
- Focus rings (`:focus-visible`) → `2px solid --brass`
- Eyebrows + footer accents → `--brass-300`
- AI assistant identity (`.chat-ai-avatar`) → `--grad-brass`

**Do not** brass everything. Body text, surfaces, cards, and dark chrome stay warm-neutral; brass is the spark, ≤ ~10% of any view.

---

## 4. Chrome

**Header (`Nav` + `src/app/globals.css .nav`)** — flat warm-ink `--ink` bar (no gradient), serif `wandr` logo with brass spark. Trimmed to two left items — `Home` + an `Explore` Radix popover holding the six categories (light cream panel, brass-tint active item). Centered glass search with a typewriter placeholder cycling example queries (frozen on focus, static under `prefers-reduced-motion`) and brass focus ring. Right cluster: icon-only calendar + avatar / **brass gradient `Connexion` CTA**.

**Footer (`SiteFooter`)** — `--ink-950` warm-black, brass top hairline, serif brand word, brass uppercase column headers, brass link hover with slide. Links wired to real routes only: `/ /sport /dining /culture /outdoor /nightlife` and `/chat /calendar /favorites /profile`.

---

## 5. Shape, depth, motion

- Radii: card `12px`, button `9px`, pill `999px`.
- Shadows: warm-tinted `--shadow-sm/md/lg`; brass glow `--shadow-brass` on primary-button hover.
- Motion: micro-interactions `150–300ms`, `--ease cubic-bezier(0.22,0.61,0.36,1)`; hero parallax + scroll-reveal rail. Respect `prefers-reduced-motion`.
- Transitions on color/opacity/transform only — never width/height.

---

## 6. Accessibility (must pass)

- Body text ≥ 4.5:1. Brass `#C68A3A` on white ≈ 3.0:1 → **use `--brass-700 #9C6A28` for brass text on light** (≥ 4.5:1); reserve `--brass`/gradient for fills with white text and for large/non-text accents.
- Visible `:focus-visible` ring on every interactive element.
- Icon-only buttons carry `aria-label`. Color is never the sole signal (LIVE has pulse + text).
- Responsive checks at 375 / 768 / 1024 / 1440px.

---

## 7. Anti-patterns

- ❌ Blue/SaaS-generic accent · ❌ promoting LIVE red to a general accent · ❌ cold grey reappearing (use warm neutrals) · ❌ emoji as icons (use the `Icon` set) · ❌ brass text < 4.5:1 on light · ❌ hover states that shift layout (use color/opacity/translate, not scale on flow elements).

---

## 8. Adding a surface

Pages are config (`CATEGORY_PRESETS`, `HOME_PRESET`). Reuse existing components and tokens; never hardcode hex. If a page needs to deviate, document it in `design-system/wandr/pages/<page>.md` — it overrides this Master.
