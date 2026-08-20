# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Today: a single seeded user (Hugo, `SEED_USER_EMAIL`) using Wandr personally to find things to do. Multi-user is a confirmed future direction — real authentication and per-user accounts are planned (see `SPEC.md`) but not yet built.

## Product Purpose

A feed of local activities, personalized to each user's preferences across categories (sport, dining, culture, outdoor, nightlife, romantic). The user browses a single unified feed — with map and filters — rather than hunting category by category.

## Positioning

Personalization by category affinity is the mechanism a neighboring product can't truthfully copy: the feed adapts to each user's stated preferences across all categories at once, and an AI chat assistant surfaces recommendations conversationally on top of the same feed. This differs from single-purpose tools (Eventbrite: events only, no cross-category personalization; Google Maps: no curation or preference-based ranking; editorial city guides: same list for everyone).

## Operating Context

Single city today: Montreal is the only seeded city, and this is intentional scope for the current stage, not an oversight.

Confirmed future direction: a city switcher in the top search bar, where selecting a city scopes the whole feed (activities shown) to that city. Not yet built — no multi-city data exists beyond Montreal.

## Capabilities and Constraints

- Single-user POC today; multi-user auth (Google + email/password) is speced in `SPEC.md` but not implemented.
- Category affinities already drive feed personalization (`UserCategoryAffinity` + `GetFeedUseCase`).
- City is currently a fixed default (Montreal), not a user-facing selector — city switching is an explicit open decision for future work, not a current capability.

## Evidence on Hand

No testimonials, case studies, press, or external evidence exist. Do not fabricate any.

## Product Principles

- One feed, not six silos: categories are a filter on a single personalized feed, not separate products.
- Personalization is by explicit stated affinity, not inferred/black-box behavior.
- Chat is a second interface onto the same feed and data — not a separate recommendation engine.
- Scope stays single-city until multi-city (city switcher) is deliberately built; don't design as if multi-city already works.
- Stage is personal POC: build for one real user (Hugo) today, but the multi-user and multi-city directions are already committed, not speculative — don't block on them, but don't design against them either.
