import type { UpgradeRadarData } from "@/features/upgrades/types";
import { isMockMode } from "@/lib/config/public";
import { upgradeRadarFixture } from "@/features/upgrades/mock";
import { apiGet } from "@/lib/api/client-server";

export async function getUpgradeRadar(): Promise<UpgradeRadarData | null> {
  if (isMockMode()) return upgradeRadarFixture;
  try {
    return await apiGet<UpgradeRadarData>("/upgrade-radar");
  } catch {
    return null;
  }
}
