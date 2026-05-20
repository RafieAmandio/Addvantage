import { z } from "zod";

export const rsiHeatmapQuerySchema = z.object({
  interval: z.enum(["1h", "4h", "1d", "all"]).default("1h"),
});

export const rsiDetailParamsSchema = z.object({
  symbol: z.string().min(1).max(32),
});
