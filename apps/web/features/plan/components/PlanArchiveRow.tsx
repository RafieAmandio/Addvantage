import { memo } from "react";
import Link from "next/link";
import type { TradingPlan } from "@/lib/mock/types";
import { computePlanOutcome } from "@/features/plan/mock";
import { Highlight } from "@/components/ui/Highlight";
import { formatDate } from "@/lib/cn";

type Props = {
  plan: TradingPlan;
  isLatest: boolean;
  query: string;
};

function PlanArchiveRowImpl({ plan, isLatest, query }: Props) {
  const longs = plan.setups.filter((s) => s.direction === "long").length;
  const shorts = plan.setups.filter((s) => s.direction === "short").length;
  const outcome = computePlanOutcome(plan);

  return (
    <Link
      href={`/app/plan/${plan.id}`}
      className="group grid grid-cols-12 gap-6 bg-ink p-6 transition-colors hover:bg-ink-2"
    >
      {/* Meta column */}
      <div className="col-span-12 lg:col-span-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
            <Highlight text={plan.id} query={query} />
          </span>
          {isLatest && (
            <span className="border border-lime bg-lime/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest2 text-lime">
              ● LATEST
            </span>
          )}
        </div>
        <div className="mt-2 font-display text-2xl text-paper">
          {formatDate(plan.date)}
        </div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
          {plan.horizon} · by {plan.authoredBy}
        </div>
        <div className="mt-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2">
          <span className="text-moss">▲ {longs} long</span>
          <span className="text-paper/30">·</span>
          <span className="text-lime">▼ {shorts} short</span>
        </div>
        {outcome && !isLatest && (
          <div className="mt-3 flex items-baseline gap-3 border-t border-ink-3 pt-3">
            <div
              className={
                "font-display text-2xl " +
                (outcome.totalR > 0
                  ? "text-moss"
                  : outcome.totalR < 0
                  ? "text-blood"
                  : "text-paper/70")
              }
            >
              {outcome.totalRLabel}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
              {outcome.wins}W · {outcome.losses}L
              {outcome.flat > 0 && ` · ${outcome.flat}F`}
              {outcome.skipped > 0 && ` · ${outcome.skipped}S`}
            </div>
          </div>
        )}
        {isLatest && (
          <div className="mt-3 border-t border-ink-3 pt-3 font-mono text-[10px] uppercase tracking-widest2 text-lime">
            ● LIVE · no outcome yet
          </div>
        )}
      </div>

      {/* Thesis column */}
      <div className="col-span-12 lg:col-span-9">
        <p
          className="line-clamp-3 font-display text-lg leading-relaxed text-paper/85 transition-colors group-hover:text-paper"
          title={plan.thesis}
        >
          <Highlight text={plan.thesis} query={query} />
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {plan.setups.map((s) => (
            <span
              key={s.id}
              className={
                "border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 " +
                (s.direction === "long"
                  ? "border-moss/50 text-moss"
                  : "border-lime/50 text-lime")
              }
            >
              {s.direction === "long" ? "▲" : "▼"}{" "}
              <Highlight text={s.instrument} query={query} />
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export const PlanArchiveRow = memo(PlanArchiveRowImpl);
