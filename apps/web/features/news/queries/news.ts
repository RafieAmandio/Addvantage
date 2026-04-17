import { z } from "zod";
import { IMPACT_LEVELS, BIAS_LEVELS } from "@tradevantage/shared";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const ImpactSchema = z.enum(IMPACT_LEVELS);
const BiasSchema = z.enum(BIAS_LEVELS);

/**
 * Narrow shape for the public news feed. Mirrors the SELECT column list in
 * `listApprovedNews` / `getApprovedNewsById`. Validated at the query boundary
 * — if the DB schema drifts, parse fails fast instead of corrupting the view.
 */
const NewsListRowSchema = z.object({
  id: z.string(),
  source_code: z.string(),
  headline: z.string(),
  analysis: z.string(),
  impact: ImpactSchema,
  bias: BiasSchema,
  affects: z.array(z.string()),
  tags: z.array(z.string()),
  author: z.string(),
  published_at: z.string().nullable(),
  fetched_at: z.string(),
  status: z.string(),
});

const NewsListItemSchema = NewsListRowSchema.omit({ status: true });
export type NewsListItem = z.infer<typeof NewsListItemSchema>;

/**
 * Full news_items row used by the admin review queues. Keep in sync with the
 * DB columns; new columns must be added here too or `listPendingNews` /
 * `listRejectedNews` will reject them.
 */
const NewsRowSchema = z.object({
  id: z.string(),
  source_code: z.string(),
  source_url: z.string().nullable(),
  raw_text: z.string().nullable(),
  content_hash: z.string(),
  fetched_at: z.string(),
  published_at: z.string().nullable(),
  status: z.string(),
  headline: z.string(),
  rephrased: z.string().nullable(),
  analysis: z.string(),
  impact: ImpactSchema,
  bias: BiasSchema,
  affects: z.array(z.string()),
  tags: z.array(z.string()),
  author: z.string(),
  reviewed_at: z.string().nullable(),
  reviewed_by: z.string().nullable(),
  related_plan_ids: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});
export type NewsRow = z.infer<typeof NewsRowSchema>;

const NEWS_LIST_COLUMNS =
  "id,source_code,headline,analysis,impact,bias,affects,tags,author,published_at,fetched_at,status";

function toListItem(row: z.infer<typeof NewsListRowSchema>): NewsListItem {
  // Drop status from the public projection.
  const { status: _status, ...rest } = row;
  return rest;
}

/** Public-facing news feed: APPROVED items only, newest first. RLS enforces this. */
export async function listApprovedNews(): Promise<NewsListItem[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("news_items")
    .select(NEWS_LIST_COLUMNS)
    .eq("status", "approved")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("fetched_at", { ascending: false })
    .limit(200);
  if (error) {
    logger.error("listApprovedNews failed", { error, scope: "news.listApprovedNews" });
    return [];
  }
  const parsed = NewsListRowSchema.array().safeParse(data ?? []);
  if (!parsed.success) {
    logger.error("listApprovedNews shape mismatch", {
      issues: parsed.error.issues,
      scope: "news.listApprovedNews",
    });
    return [];
  }
  return parsed.data.map(toListItem);
}

export async function getApprovedNewsById(id: string): Promise<NewsListItem | null> {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("news_items")
    .select(NEWS_LIST_COLUMNS)
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  if (!data) return null;
  const parsed = NewsListRowSchema.safeParse(data);
  if (!parsed.success) {
    logger.error("getApprovedNewsById shape mismatch", {
      id,
      issues: parsed.error.issues,
      scope: "news.getApprovedNewsById",
    });
    return null;
  }
  return toListItem(parsed.data);
}

/** Admin: pending review queue, oldest first. */
export async function listPendingNews(): Promise<NewsRow[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("news_items")
    .select("*")
    .eq("status", "pending")
    .order("fetched_at", { ascending: true });
  if (error) throw error;
  return NewsRowSchema.array().parse(data ?? []);
}

export async function listRejectedNews(): Promise<NewsRow[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("news_items")
    .select("*")
    .eq("status", "rejected")
    .order("reviewed_at", { ascending: false });
  if (error) throw error;
  return NewsRowSchema.array().parse(data ?? []);
}

export async function getNewsItemById(id: string): Promise<NewsRow | null> {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("news_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return NewsRowSchema.parse(data);
}
