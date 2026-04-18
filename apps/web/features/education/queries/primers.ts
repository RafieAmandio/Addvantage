import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { PrimerSchema, type Primer } from "@/features/education/types";

const PRIMER_COLUMNS =
  "slug,title,author,framework,summary,body,tags,reading_min,locked";

type PrimerRow = {
  slug: string;
  title: string;
  author: string;
  framework: string | null;
  summary: string | null;
  body: string[];
  tags: string[];
  reading_min: number;
  locked: boolean;
};

function toPrimer(row: PrimerRow): Primer | null {
  const parsed = PrimerSchema.safeParse({
    id: row.slug,
    title: row.title,
    author: row.author,
    framework: row.framework ?? "",
    summary: row.summary ?? "",
    body: row.body,
    tags: row.tags,
    readingMin: row.reading_min,
    locked: row.locked,
  });
  if (!parsed.success) {
    logger.error("education primer shape mismatch", {
      slug: row.slug,
      issues: parsed.error.issues,
      scope: "education.primers",
    });
    return null;
  }
  return parsed.data;
}

/**
 * Public education library feed. RLS only returns `published = true` rows
 * to non-admins (see migration 0020). Ordering matches the old static
 * array: `sort_order asc` with `created_at` as tie-breaker.
 */
export async function listPublishedPrimers(): Promise<Primer[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("education_primers")
    .select(PRIMER_COLUMNS)
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    logger.error("listPublishedPrimers failed", {
      error,
      scope: "education.listPublishedPrimers",
    });
    return [];
  }
  return (data ?? [])
    .map((row) => toPrimer(row as PrimerRow))
    .filter((p): p is Primer => p !== null);
}

/** Single primer by slug (the legacy `P-001` style id). RLS still applies. */
export async function getPrimerBySlug(slug: string): Promise<Primer | null> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("education_primers")
    .select(PRIMER_COLUMNS)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) {
    logger.error("getPrimerBySlug failed", {
      slug,
      error,
      scope: "education.getPrimerBySlug",
    });
    return null;
  }
  if (!data) return null;
  return toPrimer(data as PrimerRow);
}
