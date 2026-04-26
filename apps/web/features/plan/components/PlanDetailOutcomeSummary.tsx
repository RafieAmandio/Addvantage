import { cn } from "@/lib/cn";
import { DataLabel } from "@/components/ui/Marker";
import type { TradingPlan } from "@/features/plan/types";
import type { PlanOutcomeDigest } from "@/features/plan/lib/detail-helpers";

export function PlanDetailOutcomeSummary({
  outcome,
  plan,
}: {
  outcome: PlanOutcomeDigest;
  plan: TradingPlan;
}) {
  return (
    <section className="mt-8 border border-gray-3 bg-gray-2/40 p-5">
      <DataLabel>Plan outcome</DataLabel>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
            Total R
          </div>
          <div
            className={cn(
              "font-display text-2xl sm:text-4xl",
              outcome.totalR > 0
                ? "text-moss"
                : outcome.totalR < 0
                ? "text-blood-bright"
                : "text-white/70"
            )}
          >
            {outcome.totalRLabel}
          </div>
        </div>
        <OutcomeStat label="Wins" value={outcome.wins} tone="moss" />
        <OutcomeStat label="Losses" value={outcome.losses} tone="blood" />
        {outcome.flat > 0 && (
          <OutcomeStat label="Flat" value={outcome.flat} tone="muted" />
        )}
        {outcome.skipped > 0 && (
          <OutcomeStat label="Skipped" value={outcome.skipped} tone="muted" />
        )}
        <div className="ml-auto font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          {outcome.closed} / {plan.setups.length} setups closed
        </div>
      </div>
    </section>
  );
}

function OutcomeStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "moss" | "blood" | "muted";
}) {
  const color =
    tone === "moss"
      ? "text-moss"
      : tone === "blood"
      ? "text-blood-bright"
      : "text-white/60";
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
        {label}
      </div>
      <div className={cn("font-display text-2xl", color)}>{value}</div>
    </div>
  );
}
