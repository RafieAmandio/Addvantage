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
  imageUrl?: string | null;
}

export interface TradingPlan {
  id: string;
  date: string;
  horizon: "intraday" | "swing" | "weekly";
  bias: Bias;
  thesis: string;
  setups: TradingSetup[];
  risks: string[];
  authoredBy: string;
  imageUrl?: string | null;
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

export const PlanBiasSchema = z.enum(["bullish", "bearish", "neutral"]);

export const PlanRowSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  thesis: z.string(),
  direction: PlanDirectionSchema,
  bias: PlanBiasSchema.default("neutral"),
  entry: z.number().nullable(),
  stop: z.number().nullable(),
  target: z.number().nullable(),
  rMultiple: z.number().nullable(),
  setups: z.array(PlanSetupSchema).default([]),
  tags: z.array(z.string()),
  risks: z.array(z.string()).default([]),
  tier: PlanTierSchema,
  status: PlanStatusSchema,
  outcome: PlanOutcomeSchema.nullable(),
  closePrice: z.number().nullable(),
  realizedR: z.number().nullable(),
  authorId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  imageUrl: z.string().nullable().optional(),
  imageKey: z.string().nullable().optional(),
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
