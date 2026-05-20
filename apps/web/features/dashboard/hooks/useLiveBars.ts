import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api/client";
import type { Bar } from "@/features/chart/components/PriceChart";

export type Timeframe = "1D" | "1W" | "1M";

interface BarsResponse {
  bars: Array<{
    ts: string;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: number | null;
  }>;
}

function buildParams(symbol: string, tf: Timeframe) {
  const now = new Date();
  let from: Date;
  let interval: string;

  switch (tf) {
    case "1D":
      from = new Date(now);
      from.setUTCHours(0, 0, 0, 0);
      interval = "1h";
      break;
    case "1W":
      from = new Date(now.getTime() - 7 * 86400000);
      interval = "1h";
      break;
    case "1M":
      from = new Date(now.getTime() - 30 * 86400000);
      interval = "1d";
      break;
  }

  return { interval, from: from.toISOString(), to: now.toISOString() };
}

export function useLiveBars(symbol: string, tf: Timeframe) {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const { interval, from, to } = buildParams(symbol, tf);
    const qs = new URLSearchParams({ symbol, interval, from, to });

    apiGet<BarsResponse>(`/bars?${qs}`)
      .then((data) => {
        if (cancelled) return;
        const mapped: Bar[] = [];
        for (const b of data.bars) {
          if (b.open === null || b.high === null || b.low === null || b.close === null) continue;
          mapped.push({
            time: b.ts,
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
            volume: b.volume ?? undefined,
          });
        }
        setBars(mapped);
      })
      .catch(() => {
        if (!cancelled) setBars([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [symbol, tf]);

  return { bars, loading };
}

export { buildParams };
