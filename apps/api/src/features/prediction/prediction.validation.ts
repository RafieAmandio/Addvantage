import { z } from "zod";

export const historyQuerySchema = z.object({
  tokenId: z.string().min(1),
  interval: z.enum(["1d", "1w", "1m", "max"]).default("1m"),
  fidelity: z.coerce.number().int().min(1).max(1440).default(60),
});
