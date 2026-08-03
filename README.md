# Salonomia

Standalone, multi-tenant salon reservation application. This project is intentionally isolated from the adjacent `salonman` repository.

## Run locally

1. Copy `.env.example` to `.env` and set a new Neon/PostgreSQL `DATABASE_URL` plus a random `BETTER_AUTH_SECRET`.
2. Run `pnpm prisma:generate`.
3. Run `pnpm prisma:migrate --name init_salonomia`.
4. Run `pnpm prisma:seed`.
5. Run `pnpm dev`.

The local seed creates one working account per access level. All local demo accounts use password `Salonomia-Local-Only-1!`:

| Access level | Email |
| --- | --- |
| Super Admin | `superadmin@salonomia.local` |
| Salon Admin | `salonadmin@salonomia.local` |
| Salon Manager | `salonmanager@salonomia.local` |
| Customer | `customer@salonomia.local` |

Change or remove these accounts outside local development.

## Security deployment note

Before production, apply the Prisma migration to PostgreSQL and add a PostgreSQL exclusion constraint for active appointment ranges (`providerId`, `startsAt`, `blockedEndTime`). Application validation is present, but the database constraint is required for race-proof multi-instance conflict protection.
