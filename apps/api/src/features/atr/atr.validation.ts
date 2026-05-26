import { z } from "zod";

export const atrDetailParamsSchema = z.object({
  symbol: z.string().min(1).max(32),
});
