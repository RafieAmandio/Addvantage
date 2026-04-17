# @tradevantage/db

Single source of truth for the Supabase schema.

## Layout

```
packages/db/
├── migrations/       # Numbered SQL files — apply via Supabase MCP / psql
│   ├── 0001_init.sql
│   ├── 0002_news_items.sql
│   ├── 0003_rls.sql
│   └── 0004_seed_sources.sql
├── src/
│   ├── index.ts      # re-exports Database type
│   └── types.ts      # generated via `supabase gen types typescript`
└── package.json
```

## Regenerating types

After any migration:

```bash
# via Supabase CLI
supabase gen types typescript --project-id qawrdgttfpslyelocfmx \
  > packages/db/src/types.ts
```

Or via the MCP `generate_typescript_types` tool, piped to `src/types.ts`.

## Migration rules

1. **Never edit a committed migration.** Add a new numbered file instead.
2. **DDL only in migrations.** Seed data goes in `migrations/` too if it's canonical (source registry), but per-row user data never belongs here.
3. **RLS first.** Every new table must ship with its RLS policy in the same migration.

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
