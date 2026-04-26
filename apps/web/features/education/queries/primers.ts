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

const DEFAULT_PRIMER_LIMIT = 100;

export async function listPublishedPrimers(
  input: { limit?: number } = {},
): Promise<Primer[]> {
  const limit = input.limit ?? DEFAULT_PRIMER_LIMIT;
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("education_primers")
    .select(PRIMER_COLUMNS)
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .range(0, limit - 1);
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
