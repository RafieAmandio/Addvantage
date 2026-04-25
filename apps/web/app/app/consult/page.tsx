import { Suspense } from "react";
import { ConsultPageView } from "@/features/consult/components/ConsultPageView";
import {
  listConsultSessions,
  listConsultMessages,
} from "@/features/consult/queries/messages";
import type { InitialConsultData } from "@/features/consult/hooks/useConsultPersistence";
import type { LocalSession } from "@/features/consult/types";
import type { ConsultMessage } from "@/lib/mock/types";

export const dynamic = "force-dynamic";

/**
 * Maps a `consult_messages` row to the in-app `ConsultMessage` shape used
 * by the chat UI. DB role 'assistant' is surfaced as 'ai' to match the
 * existing client type; tags are empty because the DB schema doesn't yet
 * store them (canned-reply tags are re-derived client-side).
 */
function rowToMessage(row: {
  id: string;
  role: string;
  content: string;
  created_at: string;
}): ConsultMessage {
  return {
    id: row.id,
    role: row.role === "user" ? "user" : "ai",
    ts: row.created_at,
    body: row.content,
    tags: [],
  };
}

export default async function ConsultPage({
  searchParams,
}: {
  searchParams?: { sq?: string };
}) {
  // Pull the user's sessions (newest-first) from Supabase. RLS gates to the
  // authenticated user; `/app/*` is already auth-guarded by middleware so
  // this is safe. Returns [] on any error — UI degrades to localStorage.
  const rows = await listConsultSessions(50);

  const sessions: LocalSession[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    startedAt: r.created_at,
    lastAt: r.updated_at,
    tags: [],
    messages: [],
  }));

  // Pre-fetch messages for the session hinted at by `?sq=` (if any — the
  // search param doubles as both filter query and "activate this session").
  // Other sessions load on demand via the client mutation flow.
  const activeId = searchParams?.sq;
  const extras: Record<string, ConsultMessage[]> = {};
  if (activeId && rows.some((r) => r.id === activeId)) {
    const msgs = await listConsultMessages(activeId);
    extras[activeId] = msgs.map(rowToMessage);
  }

  const initialData: InitialConsultData = { sessions, extras };

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-brand">
            <span className="led" />
            OPENING CHANNEL
          </div>
        </div>
      }
    >
      <ConsultPageView initialData={initialData} />
    </Suspense>
  );
}
