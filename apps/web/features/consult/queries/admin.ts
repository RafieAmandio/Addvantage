import type { ConsultMessageRow } from "@/features/consult/types";
import { apiGet } from "@/lib/api/client-server";

export interface AdminConsultSession {
  id: string;
  title: string;
  status: string;
  unreadAdmin: boolean;
  unreadUser: boolean;
  userId: string;
  user: { email: string; handle: string | null };
  _count: { messages: number };
  createdAt: string;
  updatedAt: string;
}

export interface AdminConsultStats {
  open: number;
  awaitingReply: number;
  unread: number;
}

export async function listAdminConsultSessions(
  status?: string
): Promise<AdminConsultSession[]> {
  try {
    const query = status ? `?status=${status}` : "";
    const data = await apiGet<AdminConsultSession[]>(`/consult/admin/sessions${query}`);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function listAdminConsultMessages(
  sessionId: string
): Promise<ConsultMessageRow[]> {
  try {
    const data = await apiGet<ConsultMessageRow[]>(
      `/consult/admin/sessions/${sessionId}/messages`
    );
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getAdminConsultStats(): Promise<AdminConsultStats> {
  try {
    return await apiGet<AdminConsultStats>("/consult/admin/stats");
  } catch {
    return { open: 0, awaitingReply: 0, unread: 0 };
  }
}
