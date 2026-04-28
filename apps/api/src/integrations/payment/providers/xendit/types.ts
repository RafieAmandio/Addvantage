import { z } from "zod";

export const InvoiceCallbackSchema = z.object({
  id: z.string().min(1),
  external_id: z.string().min(1),
  status: z.string().min(1),
  paid_at: z.string().optional(),
  updated: z.string().optional(),
  created: z.string().optional(),
  description: z.string().optional(),
  payer_email: z.string().optional(),
  amount: z.number().optional(),
  metadata: z
    .object({
      profile_id: z.string().optional(),
      tier: z.string().optional(),
    })
    .partial()
    .optional(),
});

export type InvoiceCallback = z.infer<typeof InvoiceCallbackSchema>;
