import { z } from "zod";

/**
 * Bulletin — the per-instrument market-structure board on the home page.
 * Single source of truth for the payloads shared by the admin web form, the
 * API validation layer, and Jeff's ingest endpoint.
 */

export const BULLETIN_TIMEFRAMES = ["1H", "4H", "12H", "1D", "3D", "1W"] as const;
export type BulletinTimeframe = (typeof BULLETIN_TIMEFRAMES)[number];

export const MARKET_STRUCTURES = ["bullish", "bearish", "neutral"] as const;
export type MarketStructure = (typeof MARKET_STRUCTURES)[number];

export const BULLETIN_STATUSES = ["active", "watching"] as const;
export type BulletinStatus = (typeof BULLETIN_STATUSES)[number];

const symbol = z
  .string()
  .trim()
  .min(1, "Symbol required")
  .max(20)
  .transform((v) => v.toUpperCase());

const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

export const bulletinLevelSchema = z.object({
  timeframe: z.enum(BULLETIN_TIMEFRAMES),
  marketStructure: z.enum(MARKET_STRUCTURES).default("neutral"),
  bosLevel: optText(120),
  comment: optText(500),
});
export type BulletinLevelInput = z.infer<typeof bulletinLevelSchema>;

export const bulletinCreateSchema = z.object({
  symbol,
  status: z.enum(BULLETIN_STATUSES).default("active"),
  bias: z.enum(MARKET_STRUCTURES).default("neutral"),
  whatToWatch: optText(1000),
  entry: optText(1000),
  exit: optText(1000),
  note: optText(1000),
  sortOrder: z.number().int().optional(),
  levels: z.array(bulletinLevelSchema).max(BULLETIN_TIMEFRAMES.length).optional(),
});
export type BulletinCreateInput = z.infer<typeof bulletinCreateSchema>;

// Update: everything optional, symbol not required (identified by id).
export const bulletinUpdateSchema = bulletinCreateSchema.partial();
export type BulletinUpdateInput = z.infer<typeof bulletinUpdateSchema>;

// One level row upsert (admin grid saves rows individually).
export const bulletinLevelUpsertSchema = bulletinLevelSchema;

// Jeff ingest: upsert-by-symbol. Symbol required; everything else optional and
// WITHOUT defaults, so an omitted field never clobbers an existing value.
export const bulletinIngestSchema = bulletinUpdateSchema.extend({ symbol });
export type BulletinIngestInput = z.infer<typeof bulletinIngestSchema>;
