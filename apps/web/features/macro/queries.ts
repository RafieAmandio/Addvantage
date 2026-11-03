import { apiGet } from "@/lib/api/client-server";
import { isMockMode } from "@/lib/config/public";
import type { MacroData } from "./types";

const EMPTY: MacroData = { banks: {}, risk: {}, syncedAt: null };

/** Demo: move the snapshot's dates forward by whole days so it always reads as synced recently. */
async function mockMacro(): Promise<MacroData> {
  const snap = (await import("@/lib/mock/macro.json")).default as unknown as MacroData;
  const days = Math.max(0, Math.floor((Date.now() - new Date(snap.syncedAt!).getTime()) / 86_400_000));
  const json = JSON.stringify(snap).replace(/"(\d{4}-\d{2}-\d{2})(T[^"]*)?"/g, (_, d: string, t = "") => {
    const shifted = new Date(new Date(`${d}T00:00:00Z`).getTime() + days * 86_400_000).toISOString().slice(0, 10);
    return `"${shifted}${t}"`;
  });
  return { ...(JSON.parse(json) as MacroData), syncedAt: new Date(Date.now() - 40 * 60_000).toISOString() };
}

export async function getMacro(): Promise<MacroData> {
  if (isMockMode()) return mockMacro();
  try {
    return await apiGet<MacroData>("/macro");
  } catch {
    return EMPTY;
  }
}
