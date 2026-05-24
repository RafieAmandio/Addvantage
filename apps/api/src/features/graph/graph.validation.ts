import { z } from "zod";

const csvArray = z
  .string()
  .transform((s) =>
    s.split(",").map((v) => v.trim()).filter((v) => v.length > 0),
  )
  .pipe(z.array(z.string().min(1)).min(1));

export const graphQuerySchema = z.object({
  symbols: csvArray.optional(),
  types: csvArray.optional(),
  tags: csvArray.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export type GraphQuery = z.infer<typeof graphQuerySchema>;
