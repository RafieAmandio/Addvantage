#!/usr/bin/env bash
# Fails if any Prisma migration creates a table without enabling RLS in the same
# file. Prisma Migrate cannot model RLS, so the `db-drift` CI gate is blind to it —
# this guard is what stops an exposed table from shipping green.
#
# Opt out for an intentional exception by adding this line to the migration.sql:
#   -- rls-guard: ignore
set -euo pipefail

MIG_DIR="${1:-packages/db/prisma/migrations}"
fail=0

if [ ! -d "$MIG_DIR" ]; then
  echo "No migrations dir at $MIG_DIR — nothing to check."
  exit 0
fi

while IFS= read -r -d '' f; do
  if grep -qiE -- '--[[:space:]]*rls-guard:[[:space:]]*ignore' "$f"; then
    continue
  fi
  if grep -qiE 'create[[:space:]]+table' "$f"; then
    if ! grep -qiE 'enable[[:space:]]+row[[:space:]]+level[[:space:]]+security' "$f"; then
      echo "::error file=$f::Migration creates a table but has no ENABLE ROW LEVEL SECURITY in the same file. Add RLS + policies (guarded — see 0_init/migration.sql), or add '-- rls-guard: ignore' if intentional."
      fail=1
    fi
  fi
done < <(find "$MIG_DIR" -name migration.sql -print0)

if [ "$fail" -ne 0 ]; then
  echo "RLS guard FAILED — Prisma cannot model RLS; every table-creating migration must ship its own RLS."
  exit 1
fi
echo "RLS guard passed."
