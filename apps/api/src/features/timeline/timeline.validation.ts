import { z } from "zod";

export const timelineQuerySchema = z.object({
  symbols: z
    .string()
    .transform((s) =>
      s
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0),
    )
    .pipe(z.array(z.string().min(1).max(32)))
    .optional(),
  kinds: z
    .string()
    .transform((s) =>
      s
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0),
    )
    .pipe(z.array(z.enum(["news", "tweet", "macro", "earnings", "user_pin"])))
    .optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(200),
});

export const createPinSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(2000).optional(),
  symbol: z.string().trim().min(1).max(20),
  occurredAt: z.string().datetime(),
});
