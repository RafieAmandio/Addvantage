import { z } from "zod";

export const barsQuerySchema = z.object({
  symbol: z.string().min(1).max(32),
  interval: z.enum(["1m", "5m", "1h", "1d"]).default("1h"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
});
