import type { TradingPlan } from "@/features/plan/types";
import { computePlanOutcome } from "@/features/plan/lib/detail-helpers";
import { formatDate } from "@/lib/cn";

function planToDigestMarkdown(plan: TradingPlan): string {
  const out = computePlanOutcome(plan);
  const header = `## ${plan.id} · ${formatDate(plan.date)} · ${plan.horizon}`;
  const totalLine = out
    ? `**Outcome:** ${out.totalRLabel}  ·  ${out.wins}W / ${out.losses}L${out.flat > 0 ? ` / ${out.flat}F` : ""}${out.skipped > 0 ? ` / ${out.skipped}S` : ""}`
    : `**Status:** LIVE — no outcome yet`;
  const setupLines = plan.setups.map((s) => {
    const badge = s.outcome
      ? ` — **${s.outcome.toUpperCase()}**${s.outcomeR ? ` \`${s.outcomeR}\`` : ""}`
      : "";
    return `- **${s.id} ${s.instrument} ${s.direction}**${badge}: ${s.rationale}`;
  });
  return [
    header,
    ``,
    `**Thesis:** ${plan.thesis}`,
    ``,
    totalLine,
    ``,
    ...setupLines,
    ``,
  ].join("\n");
}

export function archiveDigestMarkdown(
  plans: TradingPlan[],
  latestId: string
): string {
  const closed = plans.filter((p) => p.id !== latestId);
  const totalR = closed.reduce((acc, p) => {
    const o = computePlanOutcome(p);
    return o ? acc + o.totalR : acc;
  }, 0);
  const dateRange =
    closed.length > 0
      ? `${formatDate(closed[closed.length - 1].date)} → ${formatDate(closed[0].date)}`
      : "—";

  const header = [
    `# TradeVantage — Plan Archive Digest`,
    ``,
    `**Plans:** ${closed.length} closed · ${plans.length - closed.length} live`,
    `**Range:** ${dateRange}`,
    `**Aggregate R:** ${(totalR >= 0 ? "+" : "") + totalR.toFixed(1)}R`,
    ``,
    `---`,
    ``,
  ].join("\n");

  return header + plans.map(planToDigestMarkdown).join("\n");
}
