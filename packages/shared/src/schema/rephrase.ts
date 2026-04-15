import { z } from "zod";
import {
  BIAS_LEVELS,
  HASHTAGS,
  IMPACT_LEVELS,
} from "../constants/hashtags";

/**
 * Structured output returned by the OpenAI rephrase pipeline.
 * Must be kept in lockstep with the JSON schema passed to `response_format`.
 */
export const RephraseOutputSchema = z.object({
  headline: z
    .string()
    .min(1)
    .max(240)
    .describe("Rewritten headline, punchy, no wire-service phrasing."),
  rephrased: z
    .string()
    .min(1)
    .describe("Concise rewrite of the source content, human voice."),
  analysis: z
    .string()
    .min(1)
    .describe("What this means for price — 1 to 3 tight sentences."),
  impact: z.enum(IMPACT_LEVELS),
  bias: z.enum(BIAS_LEVELS),
  affects: z
    .array(z.string())
    .describe("Tickers or instruments this item affects."),
  tags: z.array(z.enum(HASHTAGS)),
});

export type RephraseOutput = z.infer<typeof RephraseOutputSchema>;
