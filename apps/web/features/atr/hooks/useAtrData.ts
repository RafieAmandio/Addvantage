"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api/client";
import type { AtrScannerData } from "../types";

export function useAtrData() {
  const [data, setData] = useState<AtrScannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setError(null);
        const result = await apiGet<AtrScannerData>("/atr/scanner");
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to fetch ATR data");
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
  }, []);

  return { data, loading, error };
}
