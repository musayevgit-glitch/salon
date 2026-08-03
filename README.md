# Salonomia

Standalone, multi-tenant salon reservation application. This project is intentionally isolated from the adjacent `salonman` repository.

## Run locally

1. Copy `.env.example` to `.env` and set a new Neon/PostgreSQL `DATABASE_URL` plus a random `BETTER_AUTH_SECRET`.
2. Run `pnpm prisma:generate`.
3. Run `pnpm prisma:migrate --name init_salonomia`.
4. Run `pnpm prisma:seed`.
5. Run `pnpm dev`.

The local seed creates `admin@salonomia.local` with password `Salonomia-Local-Only-1!`. Change or remove it outside local development.

## Security deployment note

Before production, apply the Prisma migration to PostgreSQL and add a PostgreSQL exclusion constraint for active appointment ranges (`providerId`, `startsAt`, `blockedEndTime`). Application validation is present, but the database constraint is required for race-proof multi-instance conflict protection.
