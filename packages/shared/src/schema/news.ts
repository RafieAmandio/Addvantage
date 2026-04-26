import { z } from "zod";
import {
  BIAS_LEVELS,
  HASHTAGS,
  IMPACT_LEVELS,
  NEWS_STATUSES,
} from "../constants/hashtags";
import { SOURCE_CODES } from "../constants/sources";

/**
 * Canonical news item shape — mirrors the `news_items` table.
 * Used by web (display + edits) and worker (persist).
 */
export const NewsItemSchema = z.object({
  id: z.string().uuid(),
  source_code: z.enum(SOURCE_CODES as unknown as [string, ...string[]]),
  source_url: z.string().url().nullable(),
  content_hash: z.string(),
  fetched_at: z.string(),
  raw_text: z.string(),
  headline: z.string().min(1).max(240),
  rephrased: z.string().min(1),
  analysis: z.string().min(1),
  impact: z.enum(IMPACT_LEVELS),
  bias: z.enum(BIAS_LEVELS),
  affects: z.array(z.string()).default([]),
  tags: z.array(z.enum(HASHTAGS)).default([]),
  author: z.string(),
  status: z.enum(NEWS_STATUSES),
  reviewed_by: z.string().uuid().nullable(),
  reviewed_at: z.string().nullable(),
  published_at: z.string().nullable(),
  related_plan_ids: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
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
 * Covers all user-facing fields; server action fills id, content_hash,
 * timestamps, and review metadata.
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
  source_code: z.enum(SOURCE_CODES as unknown as [string, ...string[]]),
  source_url: z.string().url().nullable(),
  raw_text: z.string().nullable(),
});

export type NewsItemCreate = z.infer<typeof NewsItemCreateSchema>;
