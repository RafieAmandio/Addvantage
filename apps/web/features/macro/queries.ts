import { apiGet } from "@/lib/api/client-server";
import { isMockMode } from "@/lib/config/public";
import type { MacroData } from "./types";

const EMPTY: MacroData = { banks: {}, risk: {}, syncedAt: null };

export async function getMacro(): Promise<MacroData> {
  if (isMockMode()) return (await import("@/lib/mock/macro.json")).default as unknown as MacroData;
  try {
    return await apiGet<MacroData>("/macro");
  } catch {
    return EMPTY;
  }
}
