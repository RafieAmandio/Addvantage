import { apiGet } from "@/lib/api/client-server";
import { isMockMode } from "@/lib/config/public";
import { mockBulletins } from "@/lib/mock/fixtures";
import type { Bulletin } from "../types";

// Member-facing read for the home board. Swallows errors → empty list so the
// dashboard never fails to render because the bulletin endpoint hiccups.
export async function listBulletins(): Promise<Bulletin[]> {
  if (isMockMode()) return mockBulletins();
  try {
    return await apiGet<Bulletin[]>("/bulletin");
  } catch {
    return [];
  }
}
