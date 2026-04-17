import { supabaseServer } from "@/lib/supabase/server";
import type { Database } from "@tradevantage/db";

type NewsRow = Database["public"]["Tables"]["news_items"]["Row"];

export interface NewsListItem {
  id: string;
  source_code: string;
  headline: string;
  analysis: string;
  impact: "high" | "medium" | "low";
  bias: "bullish" | "bearish" | "neutral";
  affects: string[];
  tags: string[];
  author: string;
  published_at: string | null;
  fetched_at: string;
}

function toListItem(row: NewsRow): NewsListItem {
  return {
    id: row.id,
    source_code: row.source_code,
    headline: row.headline,
    analysis: row.analysis,
    impact: row.impact as NewsListItem["impact"],
    bias: row.bias as NewsListItem["bias"],
    affects: row.affects,
    tags: row.tags,
    author: row.author,
    published_at: row.published_at,
    fetched_at: row.fetched_at,
  };
}

/** Public-facing news feed: APPROVED items only, newest first. RLS enforces this. */
export async function listApprovedNews(): Promise<NewsListItem[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("news_items")
    .select(
      "id,source_code,headline,analysis,impact,bias,affects,tags,author,published_at,fetched_at,status"
    )
    .eq("status", "approved")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("fetched_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("listApprovedNews error", error);
    return [];
  }
  return (data ?? []).map((r) => toListItem(r as NewsRow));
}

export async function getApprovedNewsById(id: string): Promise<NewsListItem | null> {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("news_items")
    .select(
      "id,source_code,headline,analysis,impact,bias,affects,tags,author,published_at,fetched_at,status"
    )
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  return data ? toListItem(data as NewsRow) : null;
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
  return (data ?? []) as NewsRow[];
}

export async function listRejectedNews(): Promise<NewsRow[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("news_items")
    .select("*")
    .eq("status", "rejected")
    .order("reviewed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as NewsRow[];
}

export async function getNewsItemById(id: string): Promise<NewsRow | null> {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("news_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? (data as NewsRow) : null;
}
