import type { ClassReport } from "@/features/reports/types";
import { apiGet } from "@/lib/api/client-server";

export async function listReports(): Promise<ClassReport[]> {
  try {
    const data = await apiGet<ClassReport[]>("/reports");
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getReport(slug: string): Promise<ClassReport | null> {
  try {
    return await apiGet<ClassReport>(`/reports/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}
