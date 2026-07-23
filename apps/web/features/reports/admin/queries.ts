import type { ClassReport } from "@/features/reports/types";
import { apiGet } from "@/lib/api/client-server";

export interface ClassReportAdmin extends ClassReport {
  id: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listAllReportsForAdmin(): Promise<ClassReportAdmin[]> {
  try {
    const data = await apiGet<ClassReportAdmin[]>("/reports/admin");
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getReportForAdmin(id: string): Promise<ClassReportAdmin | null> {
  try {
    return await apiGet<ClassReportAdmin>(`/reports/admin/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}
