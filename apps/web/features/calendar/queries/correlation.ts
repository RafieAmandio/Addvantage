import type { NewsListItem } from "@/features/news/queries/news";
import { apiGet } from "@/lib/api/client-server";

if (typeof window !== "undefined") {
  throw new Error(
    "features/calendar/queries/correlation.ts is server-only",
  );
}

export async function listNewsForEvent(
  eventId: string,
): Promise<NewsListItem[]> {
  try {
    const data = await apiGet<NewsListItem[]>(`/events/${eventId}/correlation`);
    return data ?? [];
  } catch {
    return [];
  }
}
