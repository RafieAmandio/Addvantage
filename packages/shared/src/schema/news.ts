import { z } from "zod";
import {
  BIAS_LEVELS,
  HASHTAGS,
  IMPACT_LEVELS,
  NEWS_STATUSES,
} from "../constants/hashtags";
import { SOURCE_CODES } from "../constants/sources";

/**
 * Canonical news item shape — mirrors the `news_items` table (Prisma camelCase).
 */
export const NewsItemSchema = z.object({
  id: z.string().uuid(),
  sourceCode: z.enum(SOURCE_CODES as unknown as [string, ...string[]]),
  sourceUrl: z.string().url().nullable(),
  contentHash: z.string(),
  fetchedAt: z.string(),
  rawText: z.string(),
  headline: z.string().min(1).max(240),
  rephrased: z.string().min(1),
  analysis: z.string().min(1),
  impact: z.enum(IMPACT_LEVELS),
  bias: z.enum(BIAS_LEVELS),
  affects: z.array(z.string()).default([]),
  tags: z.array(z.enum(HASHTAGS)).default([]),
  author: z.string(),
  status: z.enum(NEWS_STATUSES),
  reviewedBy: z.string().uuid().nullable(),
  reviewedAt: z.string().nullable(),
  publishedAt: z.string().nullable(),
  relatedPlanIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type NewsItem = z.infer<typeof NewsItemSchema>;

/**
 * Shape used by the admin review form to PATCH a pending item before approval.
 */
export const NewsItemEditSchema = z.object({
  headline: z.string().min(1).max(240),
  rephrased: z.string().min(1),
  analysis: z.string().min(1),
  impact: z.enum(IMPACT_LEVELS),
  bias: z.enum(BIAS_LEVELS),
  affects: z.array(z.string()),
  tags: z.array(z.enum(HASHTAGS)),
  author: z.string().min(1),
});

export type NewsItemEdit = z.infer<typeof NewsItemEditSchema>;

/**
 * Shape for manually creating a news item from the admin panel.
 */
export const NewsItemCreateSchema = z.object({
  headline: z.string().min(1, "Headline is required").max(240),
  rephrased: z.string().min(1, "Body is required"),
  analysis: z.string().min(1, "Analysis is required"),
  impact: z.enum(IMPACT_LEVELS),
  bias: z.enum(BIAS_LEVELS),
  affects: z.array(z.string()),
  tags: z.array(z.enum(HASHTAGS)),
  author: z.string().min(1, "Author is required"),
  sourceCode: z.enum(SOURCE_CODES as unknown as [string, ...string[]]),
  sourceUrl: z.string().url().nullable(),
  rawText: z.string().nullable(),
});

export type NewsItemCreate = z.infer<typeof NewsItemCreateSchema>;
