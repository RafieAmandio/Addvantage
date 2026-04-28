import { cache } from "react";
import { z } from "zod";
import { isMockMode } from "@/lib/config/public";
import { apiGet } from "@/lib/api/client-server";

export const BarSchema = z.object({
  ts: z.string(),
  open: z.number().nullable(),
  high: z.number().nullable(),
  low: z.number().nullable(),
  close: z.number().nullable(),
  volume: z.number().nullable(),
});
export type Bar = z.infer<typeof BarSchema>;

interface ListBarsInput {
  symbol: string;
  interval: "1m" | "5m" | "1h" | "1d";
  from: Date;
  to: Date;
  limit?: number;
}

export const listBars = cache(async (input: ListBarsInput): Promise<Bar[]> => {
  if (isMockMode()) return [];
  try {
    const qs = new URLSearchParams({
      symbol: input.symbol,
      interval: input.interval,
      from: input.from.toISOString(),
      to: input.to.toISOString(),
    });
    if (input.limit) qs.set("limit", String(input.limit));
    const data = await apiGet<{ bars: Bar[] }>(`/bars?${qs.toString()}`);
    return (data as unknown as { bars: Bar[] }).bars ?? [];
  } catch {
    return [];
  }
});
