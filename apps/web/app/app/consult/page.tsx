import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Consult" };
import { ConsultPageView } from "@/features/consult/components/ConsultPageView";
import {
  listConsultSessions,
  listConsultMessages,
} from "@/features/consult/queries/messages";
import type { InitialConsultData } from "@/features/consult/hooks/useConsultPersistence";
import type { ConsultMessage, LocalSession } from "@/features/consult/types";
import { rowToMessage } from "@/features/consult/lib/mappers";

export const dynamic = "force-dynamic";

export default async function ConsultPage() {
  // One session per account: keep only the latest session (API returns
  // sessions newest-first, ordered updatedAt desc).
  const rows = (await listConsultSessions(1)).slice(0, 1);

  const sessions: LocalSession[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    startedAt: r.createdAt,
    lastAt: r.updatedAt,
    status: r.status,
    tags: [],
    messages: [],
  }));

  // Preload the latest session's messages by default.
  const latestId = rows[0]?.id;
  const extras: Record<string, ConsultMessage[]> = {};
  if (latestId) {
    const msgs = await listConsultMessages(latestId);
    extras[latestId] = msgs.map(rowToMessage);
  }

  const initialData: InitialConsultData = { sessions, extras };

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-brand">
            <span className="led" aria-hidden />
            OPENING CHANNEL
          </div>
        </div>
      }
    >
      <ConsultPageView initialData={initialData} />
    </Suspense>
  );
}
