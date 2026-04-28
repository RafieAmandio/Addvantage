# Archived Web Legacy Code

Archived from `apps/web/` during the Express + Prisma restructure (Phase 11).

These files were the old backend-in-frontend code: Next.js API routes, server-side
rate limiting, OpenAI client, payment/email integrations, and Supabase admin client.
All functionality has been migrated to `apps/api/` (Express backend).

## Structure

- `api/` — Old Next.js API route handlers (bars, consult/stream, events, health, search, tags, webhooks)
- `lib-server/` — Server-only libraries (openai, redis, ratelimit, payment, email, config, supabase-admin)
- `consult-lib/` — Consult feature internals (send-message, prompt, replies, usage)
- `admin-actions/` — (empty — admin actions were rewritten in-place to call Express)

## Reference

- Git history preserves all changes
- New backend lives in `apps/api/src/`
- Frontend data-fetching layer: `apps/web/lib/api/client-server.ts` + `apps/web/lib/api/client.ts`

This archive is for reference only — nothing here should be imported by live code.
