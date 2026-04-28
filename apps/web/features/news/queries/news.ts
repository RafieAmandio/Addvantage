import { cache } from "react";
import { z } from "zod";
import { IMPACT_LEVELS, BIAS_LEVELS } from "@tradevantage/shared";
import { isMockMode } from "@/lib/config/public";
import { mockApprovedNews, mockApprovedNewsById } from "@/lib/mock/fixtures";
import { apiGet } from "@/lib/api/client-server";

const ImpactSchema = z.enum(IMPACT_LEVELS);
const BiasSchema = z.enum(BIAS_LEVELS);

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

export type NewsAdminListItem = {
  id: string;
  source_code: string;
  headline: string;
  analysis: string;
  impact: string;
  bias: string;
  affects: string[];
  tags: string[];
  fetched_at: string;
  reviewed_at: string | null;
};

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
  ai_system_prompt: z.string().nullable(),
  ai_user_message: z.string().nullable(),
  ai_raw_response: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
type NewsRow = z.infer<typeof NewsRowSchema>;

export const NEWS_LIST_COLUMNS =
  "id,source_code,headline,analysis,impact,bias,affects,tags,author,published_at,fetched_at,status,related_plan_ids";

export function toNewsListItem(row: z.infer<typeof NewsListRowSchema>): NewsListItem {
  const { status: _status, ...rest } = row;
  return rest;
}

export async function listApprovedNews(): Promise<NewsListItem[]> {
  if (isMockMode()) return mockApprovedNews();
  try {
    const data = await apiGet<NewsListItem[]>("/news");
    return data ?? [];
  } catch {
    return [];
  }
}

export const getApprovedNewsById = cache(async function getApprovedNewsById(id: string): Promise<NewsListItem | null> {
  if (isMockMode()) return mockApprovedNewsById(id);
  try {
    return await apiGet<NewsListItem>(`/news/${id}`);
  } catch {
    return null;
  }
});

export async function listPendingNews(): Promise<NewsAdminListItem[]> {
  try {
    const data = await apiGet<{ content: NewsAdminListItem[] }>("/news/admin/pending");
    return (data as unknown as NewsAdminListItem[]) ?? [];
  } catch {
    return [];
  }
}

export async function listRejectedNews(): Promise<NewsAdminListItem[]> {
  try {
    const data = await apiGet<{ content: NewsAdminListItem[] }>("/news/admin/rejected");
    return (data as unknown as NewsAdminListItem[]) ?? [];
  } catch {
    return [];
  }
}

export const getNewsItemById = cache(async function getNewsItemById(id: string): Promise<NewsRow | null> {
  try {
    return await apiGet<NewsRow>(`/news/admin/${id}`);
  } catch {
    return null;
  }
});
