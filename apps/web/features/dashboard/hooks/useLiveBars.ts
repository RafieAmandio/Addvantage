import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api/client";
import { toChartBars } from "@/features/chart/lib/bars";
import type { Bar } from "@/features/chart/components/PriceChart";
import type { Bar as DbBar } from "@/features/chart/queries/bars";

export type Timeframe = "1D" | "1W" | "1M";

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
  const params = useMemo(() => buildParams(symbol, tf), [symbol, tf]);
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const qs = new URLSearchParams({
      symbol,
      interval: params.interval,
      from: params.from,
      to: params.to,
    });

    apiGet<{ bars: DbBar[] }>(`/bars?${qs}`)
      .then((data) => {
        if (!cancelled) setBars(toChartBars(data.bars));
      })
      .catch(() => {
        if (!cancelled) setBars([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [symbol, params]);

  return { bars, loading, from: params.from, to: params.to };
}
