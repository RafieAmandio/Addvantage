import Link from "next/link";
import { BiasBadge } from "@/components/ui/Marker";
import { Panel } from "@/components/ui/Panel";
import { ProseText } from "@/components/ui/ProseText";
import { cn, formatDate } from "@/lib/cn";
import type { TradingPlan, TradingSetup } from "@/features/plan/types";
import { OUTCOME_META, computePlanOutcome, rTone } from "@/features/plan/lib/detail-helpers";

const EYEBROW = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";

function CompactSetup({ setup: s, highlighted, planId }: { setup: TradingSetup; highlighted: boolean; planId: string }) {
  const meta = OUTCOME_META[s.outcome ?? "live"];
  const long = s.direction === "long";
  return (
    <Link
      href={`/app/plan/${planId}#${s.id}`}
      className="-mx-2 flex items-baseline gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
    >
      <span className={cn("w-14 shrink-0 text-[13px] font-semibold", long ? "text-up" : "text-down")}>
        {long ? "▲ Long" : "▼ Short"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[15px] font-semibold text-white">
          {s.instrument}
          {highlighted && (
            <span className="rounded-full border border-brand/50 px-2 py-px text-[11px] font-medium text-brand">In both</span>
          )}
        </p>
        <p className="line-clamp-2 text-[13px] leading-[19px] text-white/55">{s.rationale}</p>
      </div>
      {s.outcomeR && s.outcome !== "skipped" ? (
        <span className={cn("shrink-0 font-num text-[20px] font-semibold", meta.tone)}>{s.outcomeR}</span>
      ) : (
        <span className={cn("shrink-0 text-[12px] font-semibold uppercase tracking-[0.06em]", meta.tone)}>{meta.label}</span>
      )}
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

  return (
    <Panel className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
            <Link href={`/app/plan/${plan.id}`} className="hover:text-white">
              {plan.id}
            </Link>
            <span className={isLatest ? "text-brand" : undefined}>{isLatest ? "Latest" : "Archive"}</span>
            <span>{plan.horizon}</span>
            <BiasBadge bias={plan.bias} />
          </p>
          <p className="mt-1 font-num text-[32px] font-semibold leading-9 text-white">{formatDate(plan.date)}</p>
          <p className="text-[13px] text-white/55">by {plan.authoredBy}</p>
        </div>
        {outcome && !isLatest && (
          <p className={cn("font-num text-[36px] font-semibold leading-10", rTone(outcome.totalR))}>{outcome.totalRLabel}</p>
        )}
      </div>

      <p className={cn(EYEBROW, "mt-5")}>Thesis</p>
      <ProseText text={plan.thesis} className="mt-1 space-y-3" paragraphClassName="text-[15px] leading-[22px] text-white/90" />

      <p className={cn(EYEBROW, "mt-5")}>Setups · {plan.setups.length}</p>
      <div className="mt-1 divide-y divide-white/[0.07]">
        {plan.setups.map((s) => (
          <CompactSetup key={s.id} setup={s} highlighted={highlightInstruments.includes(s.instrument)} planId={plan.id} />
        ))}
      </div>

      {plan.risks.length > 0 && (
        <>
          <p className={cn(EYEBROW, "mt-5")}>Risks · {plan.risks.length}</p>
          <ol className="mt-1 divide-y divide-white/[0.07]">
            {plan.risks.map((r, i) => (
              <li key={i} className="flex gap-3 py-2 text-[14px] leading-[21px] text-white/90">
                <span className="w-4 shrink-0 font-num text-[15px] font-semibold text-down">{i + 1}</span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </Panel>
  );
}
