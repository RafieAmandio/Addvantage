import Link from "next/link";
import type { TradingPlan } from "@/features/plan/types";
import { computePlanOutcome } from "@/features/plan/mock";
import { cn, formatDate } from "@/lib/cn";

type Props = {
  allClosed: TradingPlan[];
  latest: TradingPlan;
  className?: string;
};

export function PlanArchiveRBar({ allClosed, latest, className }: Props) {
  if (allClosed.length === 0) return null;

  const sortedAsc = [...allClosed].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const rs: Array<{ plan: TradingPlan; r: number; live: boolean }> =
    sortedAsc.map((p) => {
      const o = computePlanOutcome(p);
      return { plan: p, r: o?.totalR ?? 0, live: false };
    });
  rs.push({ plan: latest, r: 0, live: true });
  const maxAbs = Math.max(
    1,
    ...rs.filter((x) => !x.live).map((x) => Math.abs(x.r))
  );

  return (
    <div className={cn("mb-6 border border-gray-3 bg-gray-2/30 p-5", className)}>
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          ● R per plan · oldest → newest
        </div>
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          {allClosed.length} closed plans
        </div>
      </div>
      <div className="relative mt-3 h-24">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/20" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
          0
        </div>
        <div className="relative flex h-full items-center gap-1 px-4">
          {rs.map(({ plan: p, r, live }, i) => {
            const heightPct = live ? 30 : (Math.abs(r) / maxAbs) * 50;
            const positive = r >= 0;
            const isFirst = i === 0;
            const isLast = i === rs.length - 1;
            const tipAlign = isFirst
              ? "left-0 translate-x-0"
              : isLast
              ? "right-0 left-auto translate-x-0"
              : "left-1/2 -translate-x-1/2";
            return (
              <Link
                key={p.id}
                href={`/app/plan/${p.id}`}
                title={
                  live
                    ? `${p.id} · ${formatDate(p.date)} · LIVE · no outcome yet`
                    : `${p.id} · ${formatDate(p.date)} · ${(r >= 0 ? "+" : "") + r.toFixed(1)}R`
                }
                className="group relative flex h-full flex-1 items-center"
              >
                {live ? (
                  <div className="absolute left-0 right-0 top-1/2 h-[30%] -translate-y-1/2 border-2 border-dashed border-brand/70 bg-brand/5 group-hover:bg-brand/10" />
                ) : (
                  <div
                    className={cn(
                      "absolute left-0 right-0",
                      positive
                        ? "bottom-1/2 bg-moss/70 group-hover:bg-moss"
                        : "top-1/2 bg-blood/70 group-hover:bg-blood"
                    )}
                    style={{ height: `${Math.max(2, heightPct)}%` }}
                  />
                )}
                <div
                  className={cn(
                    "absolute z-20 whitespace-nowrap border bg-gray-2 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 opacity-0 shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-opacity group-hover:opacity-100",
                    tipAlign,
                    live
                      ? "border-brand/60 text-brand"
                      : positive
                      ? "border-moss/60 text-moss"
                      : "border-blood/60 text-blood-text",
                    "bottom-full mb-1"
                  )}
                >
                  <div className="text-[8px] text-white/50">
                    {p.id} · {formatDate(p.date)}
                  </div>
                  <div className="font-display text-sm not-italic leading-none">
                    {live
                      ? "LIVE"
                      : (r >= 0 ? "+" : "") + r.toFixed(1) + "R"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between font-mono text-[9px] uppercase tracking-widest2 text-white/30">
        <span>{formatDate(sortedAsc[0].date)}</span>
        <span className="text-white/40">hover for R · dashed = live</span>
        <span className="text-brand">{formatDate(latest.date)}</span>
      </div>
    </div>
  );
}
