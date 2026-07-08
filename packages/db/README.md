# @tradevantage/db

Single source of truth for the Supabase schema.

> **Migration system: Prisma Migrate (as of 2026-07).** `prisma/schema.prisma` is
> the source of truth; migrations live in `prisma/migrations/` and are applied with
> `prisma migrate deploy`. The old hand-written `migrations/*.sql` files are **frozen
> as historical record only** — see "Legacy migrations" below. This switch fixed a
> drift where SQL files were applied ad-hoc via the SQL editor and never recorded, so
> prod silently diverged from the repo.

## Layout

```
packages/db/
├── prisma/
│   ├── schema.prisma          # SOURCE OF TRUTH (models = tables)
│   └── migrations/            # applied via `prisma migrate deploy`
│       ├── migration_lock.toml
│       └── 0_init/migration.sql   # squashed baseline of live prod (DDL + RLS)
├── migrations/                # FROZEN legacy SQL — historical record, do not apply
├── src/
│   ├── index.ts               # re-exports Prisma client
│   └── types.ts               # generated via `supabase gen types typescript`
└── package.json
```

## Regenerating types

After any migration:

```bash
# via Supabase CLI (prod project ref: mlbcppehtoytqqbrkirn)
supabase gen types typescript --project-id mlbcppehtoytqqbrkirn \
  > packages/db/src/types.ts
```

Or via the MCP `generate_typescript_types` tool, piped to `src/types.ts`.

## Migration workflow (Prisma Migrate)

Create a migration after editing `schema.prisma`:

```bash
# from packages/db — generates prisma/migrations/<timestamp>_<name>/migration.sql
pnpm exec prisma migrate dev --name <change_name> --create-only
```

Then apply:

```bash
pnpm exec prisma migrate deploy   # forward-only, idempotent; CI does this on deploy
```

`DATABASE_URL` for migrations must be a **session-mode** connection (Supabase pooler
port **5432**), not the transaction pooler (6543) the app uses.

### Rules

1. **Never edit an applied migration.** Create a new one. CI (`db-drift` job) fails if
   `prisma/migrations/` no longer reproduces `schema.prisma`.
2. **RLS is NOT in `schema.prisma` — hand-add it.** Prisma cannot model RLS, policies,
   `SECURITY DEFINER` functions, grants, or storage. After `migrate dev --create-only`
   generates the DDL, **append the `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` SQL to
   the same `migration.sql`** before `migrate deploy`. A table shipped without its RLS
   is the exact bug this system was adopted to prevent — check `get_advisors` after.
3. **Guard Supabase-isms so the CI shadow DB (vanilla Postgres) can replay them.**
   Follow the pattern in `0_init/migration.sql`: create `anon`/`authenticated`/
   `service_role` roles if missing, stub `auth.uid()` if absent, `SET
   check_function_bodies = off`, and wrap `storage.*` statements in an
   `IF EXISTS (… table_schema='storage' …)` guard. Otherwise the `db-drift` CI job fails
   to apply the migration.
4. **After applying, run `get_advisors`** (security + performance). Any HIGH finding is a
   blocker, not an FYI.

## Legacy migrations (`migrations/*.sql`)

Frozen historical record of the pre-Prisma hand-written SQL (`0001`–`0042`). **Do not
apply these** — `0_init/migration.sql` already squashes their cumulative effect, and it
is what prod is baselined against. They remain in the repo to document intent/history.

## Rollback strategy

Migrations are **forward-only**. There are no `*_down.sql` files and no auto-generated reverse DDL. Rolling back a bad migration in production means writing a new numbered migration that reverses the change — same review, same audit trail, same `mcp__supabase__apply_migration` workflow.

### Why forward-only

- Supabase tracks applied migrations by version; an in-place undo leaves the project in an ambiguous state across environments.
- Reverse DDL is rarely the literal inverse: dropping a column drops data, dropping a table drops rows. Writing the revert deliberately forces the author to think about data loss before it happens.
- Branching DB state with reversible migrations doesn't survive multi-developer / multi-env reality. A single linear, append-only history does.

### How to revert a bad migration

If migration `00NN_<name>.sql` shipped a problem:

1. Write a new migration `00NN+1_revert_<name>.sql` that:
   - `drop table` / `drop column` / `drop policy` / `alter ... drop constraint` for whatever the bad migration added, **and**
   - re-creates anything the bad migration removed (only possible if you have the prior DDL — read the prior migration files).
2. If the bad migration corrupted/migrated data, the revert may need a backfill from the previous shape. Always snapshot affected tables before applying the revert (`pg_dump -t public.<table>`).
3. `mcp__supabase__apply_migration` the revert. Run `get_advisors` again — fixing forward should not introduce new HIGH findings.
4. Regenerate types and commit alongside the revert: `mcp__supabase__generate_typescript_types > packages/db/src/types.ts`.

### Local dev reset

For local Supabase dev, `supabase db reset` wipes and re-applies every migration from `0001` upward. Useful when you want to rehearse the revert sequence end-to-end before applying it to staging/prod.

### Pre-flight before any DDL

- `mcp__supabase__list_migrations` first — confirm the next number and that no out-of-band DDL was applied since the last commit.
- Migrations affecting `news_items`, `timeline_events`, or `instrument_bars` should be applied during off-peak hours (the worker writes to all three).
- After applying, `mcp__supabase__get_advisors` for both `security` and `performance`. Treat any HIGH-severity finding as a blocker, not an FYI.

> The rollback/pre-flight prose above predates the Prisma Migrate switch and describes the
> legacy `mcp__supabase__apply_migration` flow. It is kept for reference, but the **only**
> supported path now is the Prisma workflow at the top of this file. `get_advisors` after a
> change is still required.

## Drift protection (CI)

Three guards keep prod and the repo in sync (`.github/workflows/`):

| Guard | When | Catches |
|-------|------|---------|
| `ci.yml` → `db-drift` | every PR | `prisma/migrations` no longer reproduce `schema.prisma` (shadow Postgres; no prod creds) |
| `ci.yml` → `db-rls-guard` | every PR | a migration adds a `CREATE TABLE` without `ENABLE ROW LEVEL SECURITY` (`scripts/check-migration-rls.sh`) |
| `db-drift-scheduled.yml` | weekly + manual | **live prod** drifted from `schema.prisma`, or any prod table has RLS disabled (catches out-of-band SQL-editor edits) |

The first two need no secrets. The scheduled one and the deploy `migrate` job need
`PROD_DIRECT_DB_URL` (below); until it's set they warn-and-skip.

## One-time setup

**GitHub secret `PROD_DIRECT_DB_URL`** — a **session-mode** Supabase connection (port
**5432**), NOT the app's transaction pooler (6543). Prisma Migrate needs session mode.

```
postgresql://postgres.mlbcppehtoytqqbrkirn:<DB-PASSWORD>@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

Get it from Supabase dashboard → Project → **Connect** → **Session pooler**. Add it under
repo → Settings → Secrets and variables → Actions. This activates both the deploy-time
`migrate` job and the weekly `db-drift-scheduled` check.

## First migration (walkthrough)

```bash
cd packages/db
# 1. edit prisma/schema.prisma (add a model / field)
# 2. generate the migration SQL (does NOT apply it)
pnpm exec prisma migrate dev --name add_widget --create-only
# 3. open prisma/migrations/<ts>_add_widget/migration.sql and, IF you added a table,
#    hand-append its RLS (copy the guarded pattern from 0_init/migration.sql):
#      alter table public.widget enable row level security;
#      create policy ... ;   -- or leave policy-less for a service-role-only table
# 4. apply to prod (or let the deploy pipeline do it)
DATABASE_URL="<session-mode url>" pnpm exec prisma migrate deploy
# 5. refresh the client + verify
pnpm exec prisma generate
#    then get_advisors(security) — must be clean.
```
