import { cache } from "react";
import { z } from "zod";
import { IMPACT_LEVELS, BIAS_LEVELS } from "@tradevantage/shared";
import { isMockMode } from "@/lib/config/public";
import { mockApprovedNews, mockApprovedNewsById } from "@/lib/mock/fixtures";
import { apiGet, apiGetRaw } from "@/lib/api/client-server";

const ImpactSchema = z.enum(IMPACT_LEVELS);
const BiasSchema = z.enum(BIAS_LEVELS);

export const NewsListRowSchema = z.object({
  id: z.string(),
  sourceCode: z.string(),
  headline: z.string(),
  analysis: z.string(),
  impact: ImpactSchema,
  bias: BiasSchema,
  affects: z.array(z.string()),
  tags: z.array(z.string()),
  author: z.string(),
  publishedAt: z.string().nullable(),
  fetchedAt: z.string(),
  status: z.string(),
  relatedPlanIds: z.array(z.string()).nullable(),
});

const NewsListItemSchema = NewsListRowSchema.omit({ status: true });
export type NewsListItem = z.infer<typeof NewsListItemSchema>;

export type NewsAdminListItem = {
  id: string;
  sourceCode: string;
  headline: string;
  analysis: string;
  impact: string;
  bias: string;
  affects: string[];
  tags: string[];
  fetchedAt: string;
  reviewedAt: string | null;
};

const NewsRowSchema = z.object({
  id: z.string(),
  sourceCode: z.string(),
  sourceUrl: z.string().nullable(),
  rawText: z.string().nullable(),
  contentHash: z.string(),
  fetchedAt: z.string(),
  publishedAt: z.string().nullable(),
  status: z.string(),
  headline: z.string(),
  rephrased: z.string().nullable(),
  analysis: z.string(),
  impact: ImpactSchema,
  bias: BiasSchema,
  affects: z.array(z.string()),
  tags: z.array(z.string()),
  author: z.string(),
  reviewedAt: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  relatedPlanIds: z.array(z.string()),
  aiSystemPrompt: z.string().nullable(),
  aiUserMessage: z.string().nullable(),
  aiRawResponse: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type NewsRow = z.infer<typeof NewsRowSchema>;

export const NEWS_LIST_COLUMNS =
  "id,sourceCode,headline,analysis,impact,bias,affects,tags,author,publishedAt,fetchedAt,status,relatedPlanIds";

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

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export async function listPendingNews(opts?: {
  page?: number;
  limit?: number;
  source?: string;
  sort?: "asc" | "desc";
}): Promise<PaginatedResult<NewsAdminListItem>> {
  try {
    const params = new URLSearchParams();
    if (opts?.page) params.set("page", String(opts.page));
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.source) params.set("source", opts.source);
    if (opts?.sort) params.set("sort", opts.sort);
    const qs = params.toString();
    const raw = await apiGetRaw<NewsAdminListItem[]>(`/news/admin/pending${qs ? `?${qs}` : ""}`);
    return {
      items: raw.data ?? [],
      total: raw.total ?? 0,
      page: raw.page ?? opts?.page ?? 1,
      limit: raw.limit ?? opts?.limit ?? 20,
    };
  } catch {
    return { items: [], total: 0, page: 1, limit: 20 };
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
