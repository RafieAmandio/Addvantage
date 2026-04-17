import Link from "next/link";
import { DataLabel, BiasBadge } from "@/components/ui/Marker";
import { cn, formatDate } from "@/lib/cn";
import type { TradingPlan, TradingSetup } from "@/lib/mock/types";
import { computePlanOutcome } from "@/features/plan/mock";

function CompactSetup({
  setup: s,
  highlighted,
  planId,
}: {
  setup: TradingSetup;
  highlighted: boolean;
  planId: string;
}) {
  const status = s.outcome ?? "live";
  const isWin = status === "win";
  const isLoss = status === "loss" || status === "stopped";

  return (
    <Link
      href={`/app/plan/${planId}#${s.id}`}
      className={cn(
        "block border p-3 transition-colors",
        highlighted
          ? "border-lime bg-lime/5 hover:bg-lime/10"
          : "border-ink-3 bg-ink hover:bg-ink-2"
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
              {s.id}
            </span>
            <span className="font-display text-base text-paper">
              {highlighted && "★ "}
              {s.instrument}
            </span>
            <span
              className={cn(
                "font-mono text-[9px] uppercase tracking-widest2",
                s.direction === "long" ? "text-moss" : "text-lime"
              )}
            >
              {s.direction}
            </span>
            <BiasBadge bias={s.bias} />
          </div>
          <div className="mt-1 line-clamp-2 font-mono text-[10px] text-paper/60">
            {s.rationale}
          </div>
        </div>
        {s.outcomeR && status !== "skipped" && (
          <div
            className={cn(
              "shrink-0 font-display text-lg",
              isWin
                ? "text-moss"
                : isLoss
                ? "text-blood"
                : "text-paper/60"
            )}
          >
            {s.outcomeR}
          </div>
        )}
      </div>
    </Link>
  );
}

export function PlanCompareColumn({
  plan,
  isLatest,
  highlightInstruments,
  className,
}: {
  plan: TradingPlan;
  isLatest: boolean;
  highlightInstruments: string[];
  className?: string;
}) {
  const outcome = computePlanOutcome(plan);
  const longs = plan.setups.filter((s) => s.direction === "long").length;
  const shorts = plan.setups.filter((s) => s.direction === "short").length;

  return (
    <article className={cn("border border-ink-3 bg-ink-2/20", className)}>
      {/* Header */}
      <div className="border-b border-ink-3 bg-ink-2/60 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/app/plan/${plan.id}`}
              className="font-mono text-[10px] uppercase tracking-widest2 text-lime hover:underline"
            >
              {plan.id}
            </Link>
            {isLatest ? (
              <span className="border border-lime bg-lime/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-lime">
                ● LATEST
              </span>
            ) : (
              <span className="border border-ink-3 bg-ink px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/50">
                ARCHIVE
              </span>
            )}
          </div>
          {outcome && !isLatest && (
            <div
              className={cn(
                "font-display text-2xl",
                outcome.totalR > 0
                  ? "text-moss"
                  : outcome.totalR < 0
                  ? "text-blood"
                  : "text-paper/60"
              )}
            >
              {outcome.totalRLabel}
            </div>
          )}
        </div>
        <div className="mt-1 font-display text-2xl text-paper">
          {formatDate(plan.date)}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
          <span>{plan.horizon}</span>
          <span className="text-lime/40">·</span>
          <span>by {plan.authoredBy}</span>
          <span className="text-lime/40">·</span>
          <span className="text-moss">▲ {longs}</span>
          <span className="text-lime">▼ {shorts}</span>
        </div>
      </div>

      {/* Thesis */}
      <div className="border-b border-ink-3 p-5">
        <DataLabel>Thesis</DataLabel>
        <p className="mt-2 font-display text-base leading-relaxed text-paper/90">
          {plan.thesis}
        </p>
      </div>

      {/* Setups list — compact for side-by-side */}
      <div className="p-5">
        <DataLabel>Setups · {plan.setups.length}</DataLabel>
        <div className="mt-3 space-y-2">
          {plan.setups.map((s) => (
            <CompactSetup
              key={s.id}
              setup={s}
              highlighted={highlightInstruments.includes(s.instrument)}
              planId={plan.id}
            />
          ))}
        </div>
      </div>

      {/* Risks */}
      {plan.risks.length > 0 && (
        <div className="border-t border-ink-3 bg-ink-2/30 p-5">
          <DataLabel>Risks · {plan.risks.length}</DataLabel>
          <ul className="mt-2 space-y-1 text-sm text-paper/70">
            {plan.risks.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono text-[10px] text-blood">
                  R0{i + 1}
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
