import type { Metadata } from "next";
import { AdminConsultView } from "./AdminConsultView";
import {
  listAdminConsultSessions,
  listAdminConsultMessages,
  getAdminConsultStats,
} from "@/features/consult/queries/admin";
import type { ConsultMessageRow } from "@/features/consult/types";

export const metadata: Metadata = { title: "Admin · Consult" };
export const dynamic = "force-dynamic";

export default async function AdminConsultPage({
  searchParams,
}: {
  searchParams?: { sq?: string; status?: string };
}) {
  const statusFilter = searchParams?.status;
  const sessions = await listAdminConsultSessions(statusFilter);
  const stats = await getAdminConsultStats();

  const activeSessionId = searchParams?.sq;
  let activeMessages: ConsultMessageRow[] = [];
  if (activeSessionId && sessions.some((s) => s.id === activeSessionId)) {
    activeMessages = await listAdminConsultMessages(activeSessionId);
  }

  return (
    <AdminConsultView
      initialSessions={sessions}
      initialMessages={activeMessages}
      initialActiveId={activeSessionId}
      stats={stats}
    />
  );
}
