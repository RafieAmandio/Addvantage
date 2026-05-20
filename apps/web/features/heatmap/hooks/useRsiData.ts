"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api/client";
import type { RsiHeatmapData } from "../types";

export function useRsiData(interval: string) {
  const [data, setData] = useState<RsiHeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setError(null);
        const result = await apiGet<RsiHeatmapData>(`/rsi/heatmap?interval=${interval}`);
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
  }, [interval]);

  return { data, loading, error };
}
