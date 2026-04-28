import type { ClosedPlanStats } from "@/features/plan/types";
import { isMockMode } from "@/lib/config/public";
import { mockClosedPlanStats } from "@/lib/mock/fixtures";
import { apiGet } from "@/lib/api/client-server";

const EMPTY_BUCKET = { n: 0, winRate: null, avgR: null } as const;
const EMPTY_STATS: ClosedPlanStats = {
  n: 0,
  winRate: null,
  avgR: null,
  byDirection: { long: { ...EMPTY_BUCKET }, short: { ...EMPTY_BUCKET } },
};

export async function getClosedPlanStats(): Promise<ClosedPlanStats> {
  if (isMockMode()) return mockClosedPlanStats();
  try {
    return await apiGet<ClosedPlanStats>("/plans/stats");
  } catch {
    return EMPTY_STATS;
  }
}
