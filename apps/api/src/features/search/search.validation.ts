import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200).transform((v) => v.trim()),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
