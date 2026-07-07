import type { UnlocksData } from "@/features/unlocks/types";
import { isMockMode } from "@/lib/config/public";
import { unlocksFixture } from "@/features/unlocks/mock";
import { apiGet } from "@/lib/api/client-server";

export async function getTokenUnlocks(): Promise<UnlocksData | null> {
  if (isMockMode()) return unlocksFixture;
  try {
    return await apiGet<UnlocksData>("/token-unlocks");
  } catch {
    return null;
  }
}
