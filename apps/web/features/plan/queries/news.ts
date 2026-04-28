import { z } from "zod";
import { apiGet } from "@/lib/api/client-server";

const NewsForPlanRowSchema = z.object({
  id: z.string(),
  source_code: z.string(),
  headline: z.string(),
  fetched_at: z.string(),
  published_at: z.string().nullable(),
});
type NewsForPlanRow = z.infer<typeof NewsForPlanRowSchema>;

export async function getNewsForPlan(
  planId: string,
): Promise<NewsForPlanRow[]> {
  try {
    const data = await apiGet<NewsForPlanRow[]>(`/plans/${planId}/news`);
    return NewsForPlanRowSchema.array().parse(data ?? []);
  } catch {
    return [];
  }
}
