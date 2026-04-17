import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

/**
 * Approved news rows that cross-link to a given trading plan id via
 * `news_items.related_plan_ids`. Narrow projection — just enough to render
 * a headline-only rail on the plan detail page.
 */
const NewsForPlanRowSchema = z.object({
  id: z.string(),
  source_code: z.string(),
  headline: z.string(),
  fetched_at: z.string(),
  published_at: z.string().nullable(),
});
export type NewsForPlanRow = z.infer<typeof NewsForPlanRowSchema>;

const NEWS_FOR_PLAN_COLUMNS =
  "id,source_code,headline,fetched_at,published_at";

/**
 * Fetch approved news items that reference `planId` in their
 * `related_plan_ids` array. RLS restricts to `status='approved'` anyway;
 * the explicit `.eq` is kept for intent.
 */
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
