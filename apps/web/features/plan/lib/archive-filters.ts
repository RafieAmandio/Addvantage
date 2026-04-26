import type { TradingPlan } from "@/features/plan/types";
import type { HorizonFilter, PlanMonthGroup } from "@/features/plan/types";

export function parseHorizon(v: string | null): HorizonFilter {
  return v === "intraday" || v === "swing" || v === "weekly" ? v : "all";
}

export function parseQuery(v: string | null): string {
  return v ? v.trim() : "";
}

export function matchesQuery(p: TradingPlan, q: string): boolean {
  if (!q) return true;
  const haystack = [
    p.id,
    p.thesis,
    ...p.risks,
    ...p.setups.flatMap((s) => [
      s.instrument,
      s.rationale,
      s.entry,
      s.stop,
      ...s.tags,
    ]),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

export function groupByMonth(plans: TradingPlan[]): PlanMonthGroup[] {
  const map = new Map<string, TradingPlan[]>();
  for (const p of plans) {
    const ym = p.date.slice(0, 7); // "2026-04"
    const list = map.get(ym) ?? [];
    list.push(p);
    map.set(ym, list);
  }
  return Array.from(map.entries())
    .map(([ym, groupPlans]) => ({
      ym,
      label: new Date(ym + "-01T00:00:00Z").toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      plans: groupPlans.sort((a, b) => b.date.localeCompare(a.date)),
    }))
    .sort((a, b) => b.ym.localeCompare(a.ym));
}
