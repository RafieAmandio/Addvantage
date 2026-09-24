import { z } from "zod";

/**
 * Public giveaway entry (giveaway.tradevantage.gg). Shared by the web form
 * server action and the API validation layer. Deduped by BingX UID.
 */

// BingX UID is a numeric account id.
const bingxUid = z
  .string()
  .trim()
  .regex(/^\d{4,24}$/, "Enter your numeric BingX UID");

export const GiveawayEntrySchema = z.object({
  bingxUid,
  // Email or Telegram handle — how we reach the winner.
  contact: z.string().trim().min(3, "Enter your email or Telegram").max(200),
  // Honeypot: real users leave this empty; bots fill it → rejected.
  website: z.string().max(0).optional(),
});
export type GiveawayEntryInput = z.infer<typeof GiveawayEntrySchema>;
