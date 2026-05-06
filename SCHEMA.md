# Wandr v0.1 Schema

Stage 1 introduces the catalogue and seed data foundation.

## Models

- `User`: seeded POC user, unique by `email`.
- `Source`: catalogue source, unique by `name`; Stage 1 seeds `manual`.
- `Activity`: single catalogue table for both `EVENT` and `PLACE`.
- `UserCategoryAffinity`: seeded per-user score from `0` to `10` for each activity category.

## Enums

- `ActivityStatus`: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- `ActivityKind`: `EVENT`, `PLACE`
- `ActivityCategory`: `SPORT`, `ROMANTIC`, `FOOD`, `CULTURE`, `OUTDOOR`, `NIGHTLIFE`

## Activity Invariants

- `EVENT` rows require `dateStart` and `dateEnd`.
- `EVENT.dateEnd` must be greater than or equal to `dateStart`.
- `PLACE` rows must keep `dateStart` and `dateEnd` null.
- `priceMinCents` must be a non-negative integer.
- `priceMaxCents`, when present, must be greater than or equal to `priceMinCents`.
- `slug` is unique and must match lowercase URL shape.

## Seed Result

`pnpm db:seed` upserts:

- 1 user from `SEED_USER_EMAIL` and `SEED_USER_NAME`
- 1 source named `manual`
- 30 activities: 15 `EVENT`, 15 `PLACE`
- 10 featured activities: 5 `EVENT`, 5 `PLACE`
- 6 user category affinities
