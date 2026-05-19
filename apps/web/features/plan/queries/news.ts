import { z } from "zod";
import { apiGet } from "@/lib/api/client-server";

const NewsForPlanRowSchema = z.object({
  id: z.string(),
  sourceCode: z.string(),
  headline: z.string(),
  fetchedAt: z.string(),
  publishedAt: z.string().nullable(),
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
