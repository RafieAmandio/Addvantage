import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { NewsListItem } from "@/features/news/queries/news";
import {
  NEWS_LIST_COLUMNS,
  toNewsListItem,
  NewsListRowSchema,
} from "@/features/news/queries/news";
import { listPublishedPrimers } from "@/features/education/queries/primers";
import type { Primer } from "@/features/education/types";
import { HASHTAGS, type Hashtag } from "@tradevantage/shared";

export async function listNewsByTag(tag: string): Promise<NewsListItem[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("news_items")
    .select(NEWS_LIST_COLUMNS)
    .eq("status", "approved")
    .contains("tags", [tag])
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(50);
  if (error) {
    logger.error("listNewsByTag failed", { error, tag, scope: "tags.listNewsByTag" });
    return [];
  }
  const parsed = NewsListRowSchema.array().safeParse(data ?? []);
  if (!parsed.success) {
    logger.error("listNewsByTag shape mismatch", {
      issues: parsed.error.issues,
      tag,
      scope: "tags.listNewsByTag",
    });
    return [];
  }
  return parsed.data.map(toNewsListItem);
}

export async function listPrimersByTag(tag: string): Promise<Primer[]> {
  const all = await listPublishedPrimers();
  return all.filter((p) => p.tags.includes(tag));
}

export type TagCount = { tag: Hashtag; newsCount: number; primerCount: number; total: number };

export async function getTagCounts(): Promise<TagCount[]> {
  const [news, primers] = await Promise.all([
    listApprovedNewsTags(),
    listPublishedPrimers(),
  ]);

  const tally = new Map<string, { news: number; primers: number }>();
  for (const tag of HASHTAGS) tally.set(tag, { news: 0, primers: 0 });

  for (const tags of news) {
    for (const t of tags) {
      const entry = tally.get(t);
      if (entry) entry.news++;
    }
  }
  for (const p of primers) {
    for (const t of p.tags) {
      const entry = tally.get(t);
      if (entry) entry.primers++;
    }
  }

  return HASHTAGS.map((tag) => {
    const entry = tally.get(tag) ?? { news: 0, primers: 0 };
    return {
      tag,
      newsCount: entry.news,
      primerCount: entry.primers,
      total: entry.news + entry.primers,
    };
  });
}

async function listApprovedNewsTags(): Promise<string[][]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("news_items")
    .select("tags")
    .eq("status", "approved");
  if (error) {
    logger.error("listApprovedNewsTags failed", { error, scope: "tags.listApprovedNewsTags" });
    return [];
  }
  return (data ?? []).map((r) => r.tags as string[]);
}
