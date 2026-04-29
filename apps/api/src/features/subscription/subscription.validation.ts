import { z } from "zod";

export const createInvoiceSchema = z.object({
  tier: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default("IDR"),
  description: z.string().optional(),
  successRedirectUrl: z.string().url().optional(),
  failureRedirectUrl: z.string().url().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
