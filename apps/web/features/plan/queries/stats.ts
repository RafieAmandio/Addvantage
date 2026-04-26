import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import {
  PlanDirectionSchema,
  PlanOutcomeSchema,
  type ClosedPlanStats,
} from "@/features/plan/types";
import { isMockMode } from "@/lib/config/public";
import { mockClosedPlanStats } from "@/lib/mock/fixtures";

const ClosedPlanStatsRowSchema = z.object({
  direction: PlanDirectionSchema,
  outcome: PlanOutcomeSchema.nullable(),
  realized_r: z.number(),
});

const EMPTY_BUCKET = { n: 0, winRate: null, avgR: null } as const;
const EMPTY_STATS: ClosedPlanStats = {
  n: 0,
  winRate: null,
  avgR: null,
  byDirection: { long: { ...EMPTY_BUCKET }, short: { ...EMPTY_BUCKET } },
};

const DEFAULT_LIMIT = 500;

interface GetClosedPlanStatsInput {
  limit?: number;
}

export async function getClosedPlanStats(
  input: GetClosedPlanStatsInput = {},
): Promise<ClosedPlanStats> {
  if (isMockMode()) return mockClosedPlanStats();
  const limit = input.limit ?? DEFAULT_LIMIT;
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("trading_plans")
      .select("direction,outcome,realized_r")
      .eq("status", "closed")
      .not("realized_r", "is", null)
      .limit(limit);
    if (error) {
      logger.error("getClosedPlanStats failed", {
        error,
        scope: "plan.getClosedPlanStats",
      });
      Sentry.captureException(error, {
        tags: { scope: "plan.getClosedPlanStats" },
      });
      return EMPTY_STATS;
    }
    const parsed = ClosedPlanStatsRowSchema.array().safeParse(data ?? []);
    if (!parsed.success) {
      logger.error("getClosedPlanStats shape mismatch", {
        issues: parsed.error.issues,
        scope: "plan.getClosedPlanStats",
      });
      Sentry.captureException(parsed.error, {
        tags: { scope: "plan.getClosedPlanStats" },
      });
      return EMPTY_STATS;
    }

    const rows = parsed.data;
    const n = rows.length;
    if (n === 0) return EMPTY_STATS;

    const wins = rows.filter((r) => r.outcome === "win").length;
    const sumR = rows.reduce((acc, r) => acc + r.realized_r, 0);

    const bucket = (dir: "long" | "short") => {
      const sub = rows.filter((r) => r.direction === dir);
      const sn = sub.length;
      if (sn === 0) return { ...EMPTY_BUCKET };
      const w = sub.filter((r) => r.outcome === "win").length;
      const s = sub.reduce((acc, r) => acc + r.realized_r, 0);
      return { n: sn, winRate: w / sn, avgR: s / sn };
    };

    return {
      n,
      winRate: wins / n,
      avgR: sumR / n,
      byDirection: { long: bucket("long"), short: bucket("short") },
    };
  } catch (err) {
    logger.error("getClosedPlanStats threw", {
      error: err,
      scope: "plan.getClosedPlanStats",
    });
    Sentry.captureException(err, {
      tags: { scope: "plan.getClosedPlanStats" },
    });
    return EMPTY_STATS;
  }
}
