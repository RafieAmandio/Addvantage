import { z } from "zod";

export const rsiHeatmapQuerySchema = z.object({
  interval: z.enum(["1h", "4h", "1d"]).default("1h"),
});
