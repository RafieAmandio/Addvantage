import { z } from "zod";

const price = z.number().finite().positive();
const iso = z.string().datetime({ offset: true });

const tradeFields = {
  symbol: z.string().trim().min(1).max(20),
  side: z.enum(["buy", "sell"]),
  setup: z.enum(["inverse-level", "same-way-level", "sfp", "gap", "gap-sfp", "accumulation", "other"]),
  timeframe: z.enum(["1H", "1D", "other"]),
  status: z.enum(["planned", "open", "closed", "cancelled"]),
  entry: price,
  stop: price,
  target: price.nullable(),
  exit: price.nullable(),
  size: z.number().finite().nonnegative().nullable(),
  // Hard cap: 2% per trade, never more.
  riskPct: z.number().positive().max(2),
  openedAt: iso,
  closedAt: iso.nullable(),
  followedPlan: z.boolean().nullable(),
  mistakes: z.array(z.string().trim().min(1).max(40)).max(20),
  notes: z.string().max(5000),
  screenshotUrl: z.string().url().max(1000).nullable(),
};

export const createTradeSchema = z
  .object(tradeFields)
  .partial({ target: true, exit: true, size: true, closedAt: true, followedPlan: true, mistakes: true, notes: true, screenshotUrl: true, timeframe: true, openedAt: true });
export const updateTradeSchema = z.object(tradeFields).partial();

export const settingsSchema = z.object({
  equity: z.number().finite().positive(),
  currency: z.string().trim().length(3).toUpperCase(),
  riskTier: z.number().positive().max(2),
});

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const planQuerySchema = z.object({ date });

export const savePlanSchema = z.object({
  date,
  picks: z
    .array(
      z.object({
        symbol: z.string().trim().min(1).max(20),
        answers: z.record(z.boolean().nullable()),
        clarity: z.number().int().min(1).max(5),
        note: z.string().max(2000).default(""),
      }),
    )
    .max(40),
});
