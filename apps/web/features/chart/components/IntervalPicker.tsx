import Link from "next/link";
import { cn } from "@/lib/cn";

export const CHART_INTERVALS = ["1m", "5m", "1h", "1d"] as const;
export type ChartInterval = (typeof CHART_INTERVALS)[number];

export function isChartInterval(v: string): v is ChartInterval {
  return (CHART_INTERVALS as readonly string[]).includes(v);
}

export function IntervalPicker({
  current,
  hrefFor,
  intervals = CHART_INTERVALS,
  className,
}: {
  current: ChartInterval;
  hrefFor: (interval: ChartInterval) => string;
  intervals?: readonly ChartInterval[];
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "flex gap-2 font-mono text-[10px] uppercase tracking-widest2",
        className,
      )}
    >
      {intervals.map((i) => (
        <Link
          key={i}
          href={hrefFor(i)}
          className={cn(
            "border px-2 py-1 transition-colors",
            i === current
              ? "border-lime bg-lime text-ink"
              : "border-ink-3 text-paper/60 hover:border-lime hover:text-lime",
          )}
        >
          {i}
        </Link>
      ))}
    </nav>
  );
}
