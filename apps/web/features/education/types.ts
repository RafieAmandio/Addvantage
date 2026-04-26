import { z } from "zod";

export const PrimerSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  framework: z.string(),
  summary: z.string(),
  body: z.array(z.string()),
  tags: z.array(z.string()),
  readingMin: z.number().int().positive(),
  locked: z.boolean(),
});

export type Primer = z.infer<typeof PrimerSchema>;
