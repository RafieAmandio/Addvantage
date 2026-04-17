import type { Bar as ChartBar } from "@/features/chart/components/PriceChart";
import type { Bar as DbBar } from "@/features/chart/queries/bars";

/**
 * Convert DB rows (nullable OHLC) to PriceChart-ready bars (strict numbers).
 * Rows with any null in open/high/low/close are dropped — Lightweight Charts
 * cannot render them.
 */
export function toChartBars(rows: DbBar[]): ChartBar[] {
  return rows.flatMap((b) => {
    if (b.open === null || b.high === null || b.low === null || b.close === null) {
      return [];
    }
    return [
      {
        time: b.ts,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        volume: b.volume ?? undefined,
      },
    ];
  });
}
