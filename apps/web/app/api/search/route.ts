import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { NEWS_LIST_COLUMNS } from "@/features/news/queries/news";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  const pattern = `%${q}%`;
  const { data } = await supabaseServer()
    .from("news_items")
    .select(NEWS_LIST_COLUMNS)
    .eq("status", "approved")
    .or(`headline.ilike.${pattern},analysis.ilike.${pattern},author.ilike.${pattern}`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(20);

  return NextResponse.json({ results: data ?? [] });
}
