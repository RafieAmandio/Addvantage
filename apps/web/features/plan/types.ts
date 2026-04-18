import { z } from "zod";
import type { TradingPlan } from "@/lib/mock/types";

// ---------------------------------------------------------------------------
// Legacy mock-era UI types. Retained so the existing archive/filter code
// (`features/plan/lib/*`, `features/plan/components/PlanArchive*`) keeps
// compiling until P3/P4 flip those consumers to the DB-backed `Plan` shape.
// ---------------------------------------------------------------------------

export type HorizonFilter = "all" | TradingPlan["horizon"];

export type HorizonRBreakdown = Record<
  TradingPlan["horizon"],
  { r: number; n: number }
>;

export type PlanMonthGroup = {
  ym: string;
  label: string;
  plans: TradingPlan[];
};

// ---------------------------------------------------------------------------
// Canonical DB row schemas for the `trading_plans` table (migration 0021).
// Pure — no Supabase/server imports — so client components may safely import
// the type aliases here without pulling the server graph into their bundle.
// Mirrors the closed taxonomy on the DB side (`check (direction in …)` etc.).
// ---------------------------------------------------------------------------

export const PlanDirectionSchema = z.enum(["long", "short"]);
export type PlanDirection = z.infer<typeof PlanDirectionSchema>;

export const PlanStatusSchema = z.enum(["draft", "published", "closed"]);
export type PlanStatus = z.infer<typeof PlanStatusSchema>;

export const PlanTierSchema = z.enum(["free", "vip"]);
export type PlanTier = z.infer<typeof PlanTierSchema>;

export const PlanOutcomeSchema = z.enum([
  "win",
  "loss",
  "breakeven",
  "stopped",
]);
export type PlanOutcome = z.infer<typeof PlanOutcomeSchema>;

/**
 * Single entry in the JSONB `setups` array. Kept intentionally loose — the
 * mock UI (`features/plan/mock.ts`) uses richer fields (`instrument`, `bias`,
 * `targets[]`, `confidence`, etc.) but v1 admin authoring only mandates a
 * label + free-text trigger/invalidation/note. Extra keys pass through via
 * `.passthrough()` so the schema won't reject richer payloads the UI chooses
 * to save — we trade strictness here for iteration speed on P3.
 */
export const PlanSetupSchema = z
  .object({
    label: z.string(),
    trigger: z.string().optional(),
    invalidation: z.string().optional(),
    note: z.string().optional(),
  })
  .passthrough();
export type PlanSetup = z.infer<typeof PlanSetupSchema>;

/**
 * Canonical Zod row schema for `public.trading_plans`. All nullable DB columns
 * are `.nullable()`; `setups` defaults to `[]` so legacy rows without the
 * column don't fail parse. Keep this in sync with the SELECT column list in
 * `features/plan/queries/plans.ts` (`PLAN_COLUMNS`) and the row shape in
 * `packages/db/src/types.ts`.
 */
export const PlanRowSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  thesis: z.string(),
  direction: PlanDirectionSchema,
  entry: z.number().nullable(),
  stop: z.number().nullable(),
  target: z.number().nullable(),
  r_multiple: z.number().nullable(),
  setups: z.array(PlanSetupSchema).default([]),
  tags: z.array(z.string()),
  tier: PlanTierSchema,
  status: PlanStatusSchema,
  outcome: PlanOutcomeSchema.nullable(),
  close_price: z.number().nullable(),
  realized_r: z.number().nullable(),
  author_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  published_at: z.string().nullable(),
  closed_at: z.string().nullable(),
});

export type Plan = z.infer<typeof PlanRowSchema>;
