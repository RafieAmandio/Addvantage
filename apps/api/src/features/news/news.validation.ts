import { z } from "zod";
import { IMPACT_LEVELS, BIAS_LEVELS, HASHTAGS, SOURCE_CODES } from "@tradevantage/shared";

export const newsCreateSchema = z.object({
  headline: z.string().min(1).max(240),
  rephrased: z.string().min(1),
  analysis: z.string().min(1),
  impact: z.enum(IMPACT_LEVELS),
  bias: z.enum(BIAS_LEVELS),
  affects: z.array(z.string()).default([]),
  tags: z.array(z.enum(HASHTAGS)).default([]),
  author: z.string().min(1),
  source_code: z.enum(SOURCE_CODES as unknown as [string, ...string[]]),
  source_url: z.string().url().nullable().default(null),
  raw_text: z.string().nullable().default(null),
});

export const newsEditSchema = z.object({
  headline: z.string().min(1).max(240),
  rephrased: z.string().min(1),
  analysis: z.string().min(1),
  impact: z.enum(IMPACT_LEVELS),
  bias: z.enum(BIAS_LEVELS),
  affects: z.array(z.string()),
  tags: z.array(z.enum(HASHTAGS)),
  author: z.string().min(1),
});
