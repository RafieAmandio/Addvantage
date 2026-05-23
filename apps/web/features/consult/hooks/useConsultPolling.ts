"use client";

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { apiGet } from "@/lib/api/client";
import { useToast } from "@/lib/toast";
import type { ConsultMessage, ConsultMessageRow, LocalSession } from "@/features/consult/types";
import { rowToMessage } from "@/features/consult/lib/mappers";

interface PollResult {
  hasNew: boolean;
  latestMessageId: string | null;
  latestAt: string | null;
}

export function useConsultPolling({
  activeId,
  extrasBySession,
  setExtrasBySession,
  setLocalSessions,
  enabled = true,
  intervalMs = 10_000,
}: {
  activeId: string;
  extrasBySession: Record<string, ConsultMessage[]>;
  setExtrasBySession: Dispatch<SetStateAction<Record<string, ConsultMessage[]>>>;
  setLocalSessions: Dispatch<SetStateAction<LocalSession[]>>;
  enabled?: boolean;
  intervalMs?: number;
}) {
  const toast = useToast();
  const lastKnownRef = useRef<string | null>(null);

  useEffect(() => {
    const msgs = extrasBySession[activeId] ?? [];
    lastKnownRef.current = msgs.length > 0 ? msgs[msgs.length - 1].ts : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    if (!activeId || !enabled) return;

    const poll = async () => {
      try {
        const after = lastKnownRef.current ?? new Date(0).toISOString();
        const result = await apiGet<PollResult>(
          `/consult/sessions/${activeId}/poll?after=${encodeURIComponent(after)}`
        );

        if (result.hasNew) {
          const messages = await apiGet<ConsultMessageRow[]>(
            `/consult/sessions/${activeId}/messages?limit=200`
          );
          const mapped = messages.map(rowToMessage);
          setExtrasBySession((prev) => ({
            ...prev,
            [activeId]: mapped,
          }));
          setLocalSessions((prev) =>
            prev.map((s) =>
              s.id === activeId ? { ...s, lastAt: new Date().toISOString() } : s
            )
          );
          if (result.latestAt) lastKnownRef.current = result.latestAt;

          const hasAdminMessage = mapped.some(
            (m) => m.role === "admin" && m.ts > after
          );
          if (hasAdminMessage) {
            toast.push({
              tone: "success",
              title: "New message from the desk",
              duration: 4000,
            });
          }
        }
      } catch {
        // silent fail on poll errors
      }
    };

    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [activeId, enabled, intervalMs, setExtrasBySession, setLocalSessions, toast]);
}
