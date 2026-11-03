import { memo } from "react";
import Link from "next/link";
import { cn, formatDate } from "@/lib/cn";
import type { TradingPlan } from "@/features/plan/types";
import { computePlanOutcome, rTone } from "@/features/plan/lib/detail-helpers";
import { Highlight } from "@/components/ui/Highlight";
import { flattenText } from "@/components/ui/ProseText";

type Props = {
  plan: TradingPlan;
  isLatest: boolean;
  query: string;
};

/** Shared column template so the header in PlanArchiveTableHead lines up with every row. */
export const ARCHIVE_COLS =
  "grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 sm:grid-cols-[132px_minmax(0,1fr)_72px_76px]";

function PlanArchiveRowImpl({ plan, isLatest, query }: Props) {
  const outcome = computePlanOutcome(plan);

  return (
    <Link
      href={`/app/plan/${plan.id}`}
      className={cn(
        ARCHIVE_COLS,
        "group -mx-2 items-center rounded-lg px-2 py-3 transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
      )}
    >
      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-[22px] text-white">{formatDate(plan.date)}</p>
        <p className="text-[12px] text-white/40">
          <Highlight text={plan.id} query={query} /> · {plan.horizon}
        </p>
      </div>

      <div className="order-last col-span-2 mt-2 min-w-0 sm:order-none sm:col-span-1 sm:mt-0">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] font-medium">
          {plan.setups.map((s) => (
            <span key={s.id} className={s.direction === "long" ? "text-up" : "text-down"}>
              {s.direction === "long" ? "▲" : "▼"} <Highlight text={s.instrument} query={query} />
            </span>
          ))}
        </div>
        <p className="mt-0.5 truncate text-[13px] text-white/55" title={flattenText(plan.thesis)}>
          <Highlight text={flattenText(plan.thesis)} query={query} />
        </p>
      </div>

      <p className="hidden text-right text-[13px] text-white/55 sm:block">
        {outcome && !isLatest ? `${outcome.wins}W ${outcome.losses}L` : ""}
      </p>

      <p className="text-right">
        {isLatest ? (
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-brand">Live</span>
        ) : outcome ? (
          <span className={cn("font-num text-[24px] font-semibold leading-7", rTone(outcome.totalR))}>
            {outcome.totalRLabel}
          </span>
        ) : (
          <span className="text-[12px] text-white/30">Open</span>
        )}
      </p>
    </Link>
  );
}

export const PlanArchiveRow = memo(PlanArchiveRowImpl);

/** Column labels for the archive table; hidden on phones where rows stack. */
export function PlanArchiveTableHead() {
  return (
    <div
      className={cn(
        ARCHIVE_COLS,
        "hidden border-b border-white/[0.07] pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/30 sm:grid",
      )}
    >
      <span>Plan</span>
      <span>Setups and thesis</span>
      <span className="text-right">Result</span>
      <span className="text-right">Realised</span>
    </div>
  );
}
