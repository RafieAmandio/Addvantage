import { z } from "zod";

const MARKET_VALUES = ["indo", "crypto", "forex", "us"] as const;

export const updateProfileSchema = z.object({
  handle: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  tradingLength: z.enum(["<1", "1-3", "3-5", "5+"]).optional(),
  longestProfitable: z.enum(["1week", "1month", "1year", "3year+"]).optional(),
  markets: z.array(z.enum(MARKET_VALUES)).optional(),
  yearlyGoal: z.string().trim().max(500).optional(),
  faultAttribution: z.enum(["vantage", "me", "market"]).optional(),
  allowMention: z.boolean().optional(),
});
