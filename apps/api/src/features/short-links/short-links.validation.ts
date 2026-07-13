import { z } from "zod";

export const shortLinkUpdateSchema = z.object({
  targetUrl: z.string().url().max(2048),
});

export type ShortLinkUpdateInput = z.infer<typeof shortLinkUpdateSchema>;
