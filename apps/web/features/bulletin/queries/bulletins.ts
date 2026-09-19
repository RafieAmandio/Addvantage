import { apiGet } from "@/lib/api/client-server";
import type { Bulletin } from "../types";

// Member-facing read for the home board. Swallows errors → empty list so the
// dashboard never fails to render because the bulletin endpoint hiccups.
export async function listBulletins(): Promise<Bulletin[]> {
  try {
    return await apiGet<Bulletin[]>("/bulletin");
  } catch {
    return [];
  }
}
