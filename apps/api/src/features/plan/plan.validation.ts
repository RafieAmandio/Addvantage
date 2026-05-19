import { z } from "zod";

const nullableNumber = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    const s = String(v).trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  });

const PlanSetupSchema = z
  .object({
    label: z.string(),
    trigger: z.string().optional(),
    invalidation: z.string().optional(),
    note: z.string().optional(),
  })
  .passthrough();

export const planCreateSchema = z.object({
  symbol: z.string().min(1).max(32),
  thesis: z.string().min(1),
  direction: z.enum(["long", "short"]),
  entry: nullableNumber,
  stop: nullableNumber,
  target: nullableNumber,
  rMultiple: nullableNumber,
  setups: z.array(PlanSetupSchema).default([]),
  tags: z.array(z.string()).default([]),
  tier: z.enum(["free", "vip"]).default("free"),
});

export const planUpdateSchema = planCreateSchema.partial();

export const planCloseSchema = z.object({
  outcome: z.enum(["win", "loss", "breakeven", "stopped"]),
  closePrice: nullableNumber,
});
