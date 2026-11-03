import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import type { TradingPlan } from "@/features/plan/types";
import { rTone, type PlanOutcomeDigest } from "@/features/plan/lib/detail-helpers";

export function PlanDetailOutcomeSummary({
  outcome,
  plan,
}: {
  outcome: PlanOutcomeDigest;
  plan: TradingPlan;
}) {
  const stats: Array<[string, number, string]> = [
    ["Wins", outcome.wins, "text-up"],
    ["Losses", outcome.losses, "text-down"],
  ];
  if (outcome.flat > 0) stats.push(["Flat", outcome.flat, "text-white/55"]);
  if (outcome.skipped > 0) stats.push(["Skipped", outcome.skipped, "text-white/30"]);

  return (
    <Panel title="Outcome" sub={`${outcome.closed} of ${plan.setups.length} setups closed`}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Realised</p>
      <p className={cn("font-num text-[52px] font-semibold leading-[56px]", rTone(outcome.totalR))}>
        {outcome.totalRLabel}
      </p>
      <div className="mt-3 flex gap-6">
        {stats.map(([label, value, tone]) => (
          <div key={label}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{label}</p>
            <p className={cn("font-num text-[28px] font-semibold leading-8", tone)}>{value}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
