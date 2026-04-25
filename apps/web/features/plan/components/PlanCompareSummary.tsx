import { cn } from "@/lib/cn";
import type { TradingPlan } from "@/lib/mock/types";
import type { CompareSummary } from "@/features/plan/lib/compare-helpers";

type Tone = "moss" | "blood" | "lime" | "paper" | "muted";

function SummaryCell({
  label,
  value,
  valueTone,
  sub,
}: {
  label: string;
  value: string;
  valueTone: Tone;
  sub: string;
}) {
  const toneClass =
    valueTone === "moss"
      ? "text-moss"
      : valueTone === "blood"
      ? "text-blood"
      : valueTone === "lime"
      ? "text-lime"
      : valueTone === "paper"
      ? "text-paper"
      : "text-paper/30";
  return (
    <div className="bg-ink p-5">
      <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
        {label}
      </div>
      <div className={cn("mt-1 font-display text-3xl", toneClass)}>
        {value}
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
        {sub}
      </div>
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
  return (
    <div
      className={cn(
        "mb-6 grid grid-cols-1 gap-px bg-gray-3 md:grid-cols-3",
        className
      )}
    >
      <SummaryCell
        label="A vs B · R delta"
        value={
          bothClosed && deltaR !== null
            ? (deltaR >= 0 ? "+" : "") + deltaR.toFixed(1) + "R"
            : "—"
        }
        valueTone={
          bothClosed && deltaR !== null
            ? deltaR > 0
              ? "moss"
              : deltaR < 0
              ? "blood"
              : "muted"
            : "muted"
        }
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
        value={
          commonInstruments.length > 0
            ? String(commonInstruments.length)
            : "—"
        }
        valueTone={commonInstruments.length > 0 ? "lime" : "muted"}
        sub={
          commonInstruments.length > 0
            ? commonInstruments.join(" · ")
            : "No shared instruments"
        }
      />
      <SummaryCell
        label="Setup counts"
        value={`${planA.setups.length} / ${planB.setups.length}`}
        valueTone="paper"
        sub={`${planA.setups.length} in A · ${planB.setups.length} in B`}
      />
    </div>
  );
}

export function PlanCompareCommonChips({
  instruments,
  className,
}: {
  instruments: string[];
  className?: string;
}) {
  if (instruments.length === 0) return null;
  return (
    <div className={cn("mb-6 flex flex-wrap gap-1.5", className)}>
      {instruments.map((i) => (
        <span
          key={i}
          className="border border-lime bg-lime/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest2 text-lime"
        >
          ★ {i}
        </span>
      ))}
    </div>
  );
}
