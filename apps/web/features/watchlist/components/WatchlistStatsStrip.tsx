import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";

interface Props {
  pinnedCount: number;
  totalNews: number;
  totalLive: number;
  totalClosed: number;
  aggregateR: number;
}

const EYEBROW = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";

export function WatchlistStatsStrip({ pinnedCount, totalNews, totalLive, totalClosed, aggregateR }: Props) {
  const cells: Array<[string, string, string]> = [
    ["Pinned", String(pinnedCount), "text-white"],
    ["News", String(totalNews), "text-white"],
    ["Live setups", String(totalLive), totalLive ? "text-brand" : "text-white"],
    [
      `Archive R · ${totalClosed}`,
      totalClosed === 0 ? "n/a" : (aggregateR >= 0 ? "+" : "") + aggregateR.toFixed(1) + "R",
      totalClosed === 0 ? "text-white/30" : aggregateR > 0 ? "text-up" : aggregateR < 0 ? "text-down" : "text-white/55",
    ],
  ];
  return (
    <Panel title="Summary">
      <div className="grid grid-cols-2 gap-4">
        {cells.map(([label, value, tone]) => (
          <div key={label}>
            <p className={EYEBROW}>{label}</p>
            <p className={cn("font-num text-[32px] font-semibold leading-9", tone)}>{value}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
