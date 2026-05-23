import { z } from "zod";

export const OutcomeSchema = z.object({
  label: z.string(),
  probability: z.number(),
  odds: z.number(),
  tokenId: z.string().nullable(),
  weekChange: z.number().nullable(),
});

export type Outcome = z.infer<typeof OutcomeSchema>;

export const TrackedMarketSchema = z.object({
  id: z.string(),
  category: z.string(),
  label: z.string(),
  eventId: z.string(),
  eventSlug: z.string(),
  eventTitle: z.string(),
  sortOrder: z.number(),
});

export type TrackedMarket = z.infer<typeof TrackedMarketSchema>;

export const PredictionCardData = z.object({
  tracked: TrackedMarketSchema,
  outcomes: z.array(OutcomeSchema),
  volume: z.number().nullable(),
  liquidity: z.number().nullable(),
  marketCount: z.number(),
  fetchedAt: z.string(),
  weekRange: z
    .object({
      min: z.number(),
      max: z.number(),
    })
    .nullable(),
});

export type PredictionCardData = z.infer<typeof PredictionCardData>;

export const PriceHistoryPoint = z.object({
  t: z.number(),
  p: z.number(),
});

export type PriceHistoryPoint = z.infer<typeof PriceHistoryPoint>;
