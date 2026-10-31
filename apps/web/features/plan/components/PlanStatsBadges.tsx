import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { rTone } from "@/features/plan/lib/detail-helpers";
import type { ClosedPlanStats } from "@/features/plan/types";

type Props = {
  stats: ClosedPlanStats;
  className?: string;
};

function formatPct(v: number | null): string {
  return v === null ? "n/a" : `${Math.round(v * 100)}%`;
}

function formatR(v: number | null): string {
  if (v === null) return "n/a";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}R`;
}

const EYEBROW = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";

/** Closed-plan track record: count, win rate, average R, split by direction. */
export function PlanStatsBadges({ stats, className }: Props) {
  if (stats.n === 0) {
    return (
      <Panel title="Track record" sub="No closed plans yet" className={className}>
        <p className="text-[14px] leading-[21px] text-white/55">Stats appear once the desk closes its first plan.</p>
      </Panel>
    );
  }

  const dirs = [
    { label: "▲ Long", tone: "text-up", b: stats.byDirection.long },
    { label: "▼ Short", tone: "text-down", b: stats.byDirection.short },
  ];

  return (
    <Panel title="Track record" sub={`${stats.n} closed plans`} className={className}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className={EYEBROW}>Win rate</p>
          <p className="font-num text-[40px] font-semibold leading-[44px] text-white">{formatPct(stats.winRate)}</p>
        </div>
        <div>
          <p className={EYEBROW}>Avg R</p>
          <p className={cn("font-num text-[40px] font-semibold leading-[44px]", rTone(stats.avgR))}>
            {formatR(stats.avgR)}
          </p>
        </div>
      </div>
      <div className="mt-4 divide-y divide-white/[0.07] border-t border-white/[0.07]">
        {dirs.map(({ label, tone, b }) => (
          <div key={label} className="flex items-baseline gap-3 py-2.5 text-[14px]">
            <span className={cn("w-16 font-semibold", tone)}>{label}</span>
            <span className="flex-1 text-white/55">
              {b.n} closed · {formatPct(b.winRate)}
            </span>
            <span className={cn("font-num text-[18px] font-semibold", rTone(b.avgR))}>{formatR(b.avgR)}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
