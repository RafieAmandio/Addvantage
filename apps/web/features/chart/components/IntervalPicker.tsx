import { SegmentedNav } from "@/components/ui/SegmentedNav";

const CHART_INTERVALS = ["1m", "5m", "1h", "1d"] as const;
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
    <SegmentedNav
      items={intervals}
      current={current}
      hrefFor={hrefFor}
      className={className}
    />
  );
}
