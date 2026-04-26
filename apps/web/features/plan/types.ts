import { z } from "zod";

export type Bias = "bullish" | "bearish" | "neutral";

export type SetupOutcome =
  | "live"
  | "open"
  | "win"
  | "loss"
  | "stopped"
  | "invalidated"
  | "skipped";

export interface TradingSetup {
  id: string;
  instrument: string;
  direction: "long" | "short";
  bias: Bias;
  entry: string;
  stop: string;
  targets: string[];
  invalidation: string;
  rationale: string;
  confidence: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  outcome?: SetupOutcome;
  outcomeNotes?: string;
  outcomeR?: string;
}

export interface TradingPlan {
  id: string;
  date: string;
  horizon: "intraday" | "swing" | "weekly";
  thesis: string;
  setups: TradingSetup[];
  risks: string[];
  authoredBy: string;
}

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

export const PlanDirectionSchema = z.enum(["long", "short"]);
type PlanDirection = z.infer<typeof PlanDirectionSchema>;

export const PlanStatusSchema = z.enum(["draft", "published", "closed"]);
export type PlanStatus = z.infer<typeof PlanStatusSchema>;

export const PlanTierSchema = z.enum(["free", "vip"]);
type PlanTier = z.infer<typeof PlanTierSchema>;

export const PlanOutcomeSchema = z.enum([
  "win",
  "loss",
  "breakeven",
  "stopped",
]);
type PlanOutcome = z.infer<typeof PlanOutcomeSchema>;

export const PlanSetupSchema = z
  .object({
    label: z.string(),
    trigger: z.string().optional(),
    invalidation: z.string().optional(),
    note: z.string().optional(),
  })
  .passthrough();
type PlanSetup = z.infer<typeof PlanSetupSchema>;

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

const PlanStatsBucketSchema = z.object({
  n: z.number(),
  winRate: z.number().nullable(),
  avgR: z.number().nullable(),
});

export const ClosedPlanStatsSchema = z.object({
  n: z.number(),
  winRate: z.number().nullable(),
  avgR: z.number().nullable(),
  byDirection: z.object({
    long: PlanStatsBucketSchema,
    short: PlanStatsBucketSchema,
  }),
});

export type ClosedPlanStats = z.infer<typeof ClosedPlanStatsSchema>;
