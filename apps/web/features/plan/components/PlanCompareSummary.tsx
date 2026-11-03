import { cn } from "@/lib/cn";
import type { TradingPlan } from "@/features/plan/types";
import type { CompareSummary } from "@/features/plan/lib/compare-helpers";
import { rTone } from "@/features/plan/lib/detail-helpers";

function SummaryCell({ label, value, tone, sub }: { label: string; value: string; tone: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-panel p-5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{label}</p>
      <p className={cn("mt-1 font-num text-[40px] font-semibold leading-[44px]", tone)}>{value}</p>
      <p className="mt-1 truncate text-[13px] text-white/55">{sub}</p>
    </div>
  );
}

export function PlanCompareSummary({
  planA,
  planB,
  summary,
  commonInstruments,
  className,
}: {
  planA: TradingPlan;
  planB: TradingPlan;
  summary: CompareSummary;
  commonInstruments: string[];
  className?: string;
}) {
  const { outcomeA, outcomeB, bothClosed, deltaR } = summary;
  const hasDelta = bothClosed && deltaR !== null;
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-3", className)}>
      <SummaryCell
        label="R delta, A vs B"
        value={hasDelta ? (deltaR! >= 0 ? "+" : "") + deltaR!.toFixed(1) + "R" : "n/a"}
        tone={hasDelta ? rTone(deltaR) : "text-white/30"}
        sub={
          bothClosed && outcomeA && outcomeB
            ? `${outcomeA.totalRLabel} vs ${outcomeB.totalRLabel}`
            : outcomeA
            ? `A closed ${outcomeA.totalRLabel} · B live`
            : outcomeB
            ? `A live · B closed ${outcomeB.totalRLabel}`
            : "Both plans still live"
        }
      />
      <SummaryCell
        label="Common instruments"
        value={commonInstruments.length > 0 ? String(commonInstruments.length) : "0"}
        tone={commonInstruments.length > 0 ? "text-brand" : "text-white/30"}
        sub={commonInstruments.length > 0 ? commonInstruments.join(" · ") : "No shared instruments"}
      />
      <SummaryCell
        label="Setup counts"
        value={`${planA.setups.length} / ${planB.setups.length}`}
        tone="text-white"
        sub={`${planA.setups.length} in A · ${planB.setups.length} in B`}
      />
    </div>
  );
}
