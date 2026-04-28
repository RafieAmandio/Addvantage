import {
  type ConsultMessageRow,
  type ConsultSessionRow,
} from "@/features/consult/types";
import { apiGet } from "@/lib/api/client-server";

export async function listConsultSessions(
  limit = 50
): Promise<ConsultSessionRow[]> {
  try {
    const data = await apiGet<ConsultSessionRow[]>(`/consult/sessions?limit=${limit}`);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function listConsultMessages(
  sessionId: string,
  input: { limit?: number } = {}
): Promise<ConsultMessageRow[]> {
  const limit = input.limit ?? 200;
  try {
    const data = await apiGet<ConsultMessageRow[]>(
      `/consult/sessions/${sessionId}/messages?limit=${limit}`
    );
    return data ?? [];
  } catch {
    return [];
  }
}
