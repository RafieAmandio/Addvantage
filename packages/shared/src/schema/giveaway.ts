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
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  // Telegram @handle or a WhatsApp number — how we reach the winner.
  telegram: z.string().trim().min(2, "Enter your Telegram or WhatsApp").max(64),
  name: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  // Honeypot: real users leave this empty; bots fill it → rejected.
  website: z.string().max(0).optional(),
});
export type GiveawayEntryInput = z.infer<typeof GiveawayEntrySchema>;
