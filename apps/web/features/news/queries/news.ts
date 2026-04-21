import { z } from "zod";
import { IMPACT_LEVELS, BIAS_LEVELS } from "@tradevantage/shared";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { isMockMode } from "@/lib/config/public";
import { mockApprovedNews, mockApprovedNewsById } from "@/lib/mock/fixtures";

const ImpactSchema = z.enum(IMPACT_LEVELS);
const BiasSchema = z.enum(BIAS_LEVELS);

/**
 * Narrow shape for the public news feed. Mirrors the SELECT column list in
 * `listApprovedNews` / `getApprovedNewsById`. Validated at the query boundary
 * — if the DB schema drifts, parse fails fast instead of corrupting the view.
 */
export const NewsListRowSchema = z.object({
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
  related_plan_ids: z.array(z.string()).nullable(),
});

const NewsListItemSchema = NewsListRowSchema.omit({ status: true });
export type NewsListItem = z.infer<typeof NewsListItemSchema>;

/**
 * Narrow projection for the admin review/archive list pages. The detail page
 * (`/admin/review/[id]`) still loads the full row via `getNewsItemById`.
 */
const NewsAdminListRowSchema = z.object({
  id: z.string(),
  source_code: z.string(),
  headline: z.string(),
  analysis: z.string(),
  impact: ImpactSchema,
  bias: BiasSchema,
  affects: z.array(z.string()),
  tags: z.array(z.string()),
  fetched_at: z.string(),
  reviewed_at: z.string().nullable(),
});
export type NewsAdminListItem = z.infer<typeof NewsAdminListRowSchema>;

const NEWS_ADMIN_LIST_COLUMNS =
  "id,source_code,headline,analysis,impact,bias,affects,tags,fetched_at,reviewed_at";

const DEFAULT_ADMIN_LIST_LIMIT = 100;

/**
 * Full news_items row used by the admin review *detail* page. Keep in sync
 * with the DB columns; new columns must be added here too or `getNewsItemById`
 * will reject them.
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

export const NEWS_LIST_COLUMNS =
  "id,source_code,headline,analysis,impact,bias,affects,tags,author,published_at,fetched_at,status,related_plan_ids";

// Full detail projection consumed by /admin/review/[id]. Explicit list (never
// `select('*')`) shields the route from column drift on news_items.
const NEWS_DETAIL_COLUMNS =
  "id,source_code,source_url,raw_text,content_hash,fetched_at,published_at,status,headline,rephrased,analysis,impact,bias,affects,tags,author,reviewed_at,reviewed_by,related_plan_ids,created_at,updated_at";

export function toNewsListItem(row: z.infer<typeof NewsListRowSchema>): NewsListItem {
  // Drop status from the public projection.
  const { status: _status, ...rest } = row;
  return rest;
}

/** Public-facing news feed: APPROVED items only, newest first. RLS enforces this. */
export async function listApprovedNews(): Promise<NewsListItem[]> {
  if (isMockMode()) return mockApprovedNews();
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
  return parsed.data.map(toNewsListItem);
}

export async function getApprovedNewsById(id: string): Promise<NewsListItem | null> {
  if (isMockMode()) return mockApprovedNewsById(id);
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
  return toNewsListItem(parsed.data);
}

export interface AdminListPage {
  limit?: number;
  offset?: number;
}

/** Admin: pending review queue, oldest first. Paginated, narrow projection. */
export async function listPendingNews(
  page: AdminListPage = {},
): Promise<NewsAdminListItem[]> {
  const limit = page.limit ?? DEFAULT_ADMIN_LIST_LIMIT;
  const offset = page.offset ?? 0;
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("news_items")
    .select(NEWS_ADMIN_LIST_COLUMNS)
    .eq("status", "pending")
    .order("fetched_at", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return NewsAdminListRowSchema.array().parse(data ?? []);
}

/** Admin: rejected archive, newest first. Paginated, narrow projection. */
export async function listRejectedNews(
  page: AdminListPage = {},
): Promise<NewsAdminListItem[]> {
  const limit = page.limit ?? DEFAULT_ADMIN_LIST_LIMIT;
  const offset = page.offset ?? 0;
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("news_items")
    .select(NEWS_ADMIN_LIST_COLUMNS)
    .eq("status", "rejected")
    .order("reviewed_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return NewsAdminListRowSchema.array().parse(data ?? []);
}

export async function getNewsItemById(id: string): Promise<NewsRow | null> {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("news_items")
    .select(NEWS_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return NewsRowSchema.parse(data);
}
