import type { ClassReport } from "@/features/reports/types";
import { isMockMode } from "@/lib/config/public";
import { classReports as mockClassReports } from "@/features/reports/mock";
import { apiGet } from "@/lib/api/client-server";

export async function listReports(): Promise<ClassReport[]> {
  if (isMockMode()) return mockClassReports();
  try {
    return (await apiGet<ClassReport[]>("/reports")) ?? [];
  } catch {
    return [];
  }
}
