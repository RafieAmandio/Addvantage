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
