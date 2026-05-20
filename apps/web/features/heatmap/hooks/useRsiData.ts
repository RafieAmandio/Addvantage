"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api/client";

function usePollingFetch<T>(endpoint: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!endpoint);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!endpoint) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        setError(null);
        const result = await apiGet<T>(endpoint);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to fetch RSI data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    fetchData();
    const id = setInterval(fetchData, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, ...deps]);

  return { data, loading, error };
}

export function useRsiData(interval: string, enabled = true) {
  return usePollingFetch<import("../types").RsiHeatmapData>(
    enabled ? `/rsi/heatmap?interval=${interval}` : null,
    [interval],
  );
}

export function useRsiTableData(enabled = true) {
  return usePollingFetch<import("../types").RsiTableData>(
    enabled ? `/rsi/heatmap?interval=all` : null,
  );
}
