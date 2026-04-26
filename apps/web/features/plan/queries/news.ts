import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const NewsForPlanRowSchema = z.object({
  id: z.string(),
  source_code: z.string(),
  headline: z.string(),
  fetched_at: z.string(),
  published_at: z.string().nullable(),
});
type NewsForPlanRow = z.infer<typeof NewsForPlanRowSchema>;

const NEWS_FOR_PLAN_COLUMNS =
  "id,source_code,headline,fetched_at,published_at";

export async function getNewsForPlan(
  planId: string,
): Promise<NewsForPlanRow[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("news_items")
    .select(NEWS_FOR_PLAN_COLUMNS)
    .eq("status", "approved")
    .contains("related_plan_ids", [planId])
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("fetched_at", { ascending: false })
    .limit(20);
  if (error) {
    logger.error("getNewsForPlan failed", {
      planId,
      error,
      scope: "plan.getNewsForPlan",
    });
    return [];
  }
  const parsed = NewsForPlanRowSchema.array().safeParse(data ?? []);
  if (!parsed.success) {
    logger.error("getNewsForPlan shape mismatch", {
      planId,
      issues: parsed.error.issues,
      scope: "plan.getNewsForPlan",
    });
    return [];
  }
  return parsed.data;
}
