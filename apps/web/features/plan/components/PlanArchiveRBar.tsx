import Link from "next/link";
import type { TradingPlan } from "@/features/plan/types";
import { computePlanOutcome } from "@/features/plan/lib/detail-helpers";
import { Panel } from "@/components/ui/Panel";
import { cn, formatDate } from "@/lib/cn";

type Props = {
  allClosed: TradingPlan[];
  latest: TradingPlan;
  className?: string;
};

/** Realised R per plan, oldest to newest, around a dotted zero line. The live plan is an outline. */
export function PlanArchiveRBar({ allClosed, latest, className }: Props) {
  if (allClosed.length === 0) return null;

  const sortedAsc = [...allClosed].sort((a, b) => a.date.localeCompare(b.date));
  const rs = sortedAsc.map((p) => ({ plan: p, r: computePlanOutcome(p)?.totalR ?? 0, live: false }));
  rs.push({ plan: latest, r: 0, live: true });
  const maxAbs = Math.max(1, ...rs.filter((x) => !x.live).map((x) => Math.abs(x.r)));
  const fmt = (r: number) => `${r >= 0 ? "+" : ""}${r.toFixed(1)}R`;

  return (
    <Panel title="R per plan" sub="Oldest to newest" className={className}>
      <div className="flex">
        <div className="relative h-24 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dotted border-white/20" />
          <div className="relative flex h-full gap-1">
            {rs.map(({ plan: p, r, live }) => (
              <Link
                key={p.id}
                href={`/app/plan/${p.id}`}
                title={live ? `${p.id} · ${formatDate(p.date)} · live, no outcome yet` : `${p.id} · ${formatDate(p.date)} · ${fmt(r)}`}
                aria-label={live ? `${p.id} live` : `${p.id} ${fmt(r)}`}
                className="group relative h-full flex-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                {live ? (
                  <div className="absolute inset-x-0 top-[35%] h-[30%] border border-dashed border-brand/70" />
                ) : (
                  <div
                    className={cn(
                      "absolute inset-x-0 opacity-80 group-hover:opacity-100",
                      r >= 0 ? "bottom-1/2 bg-up" : "top-1/2 bg-down",
                    )}
                    style={{ height: `${Math.max(2, (Math.abs(r) / maxAbs) * 50)}%` }}
                  />
                )}
              </Link>
            ))}
          </div>
        </div>
        <div className="ml-2 flex h-24 flex-col justify-between text-right font-num text-[12px] text-white/30">
          <span>{fmt(maxAbs)}</span>
          <span>0</span>
          <span>{fmt(-maxAbs)}</span>
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-white/30">
        <span>{formatDate(sortedAsc[0].date)}</span>
        <span className="text-brand">{formatDate(latest.date)}</span>
      </div>
    </Panel>
  );
}
