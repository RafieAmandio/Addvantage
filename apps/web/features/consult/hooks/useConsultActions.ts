"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { consultSessions as mockSessions } from "@/features/consult/mock";
import { pickReply } from "@/features/consult/lib/replies";
import { sessionToMarkdown } from "@/features/consult/lib/export";
import type { LocalSession } from "@/features/consult/types";
import { useToast } from "@/lib/toast";
import type { ConsultMessage, ConsultSession } from "@/lib/mock/types";

/**
 * Encapsulates the write-side of a consult session: new/send/rename/delete/
 * export, plus the pending-delete confirm dialog state. Purely UI state —
 * no persistence (that lives in `useConsultPersistence`).
 */
export function useConsultActions({
  active,
  activeId,
  setActiveId,
  extrasBySession,
  setExtrasBySession,
  setLocalSessions,
}: {
  active: ConsultSession;
  activeId: string;
  setActiveId: Dispatch<SetStateAction<string>>;
  extrasBySession: Record<string, ConsultMessage[]>;
  setExtrasBySession: Dispatch<
    SetStateAction<Record<string, ConsultMessage[]>>
  >;
  setLocalSessions: Dispatch<SetStateAction<LocalSession[]>>;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const startNewSession = () => {
    const now = new Date();
    const hhmm =
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0");
    const id = `CS-LOC-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    const session: LocalSession = {
      id,
      title: `New session · ${hhmm}`,
      startedAt: now.toISOString(),
      lastAt: now.toISOString(),
      tags: [],
      messages: [],
    };
    setLocalSessions((prev) => [session, ...prev]);
    setActiveId(id);
    setDraft("");
    toast.push({
      tone: "success",
      title: "Session opened",
      description: `${id} · awaiting first transmission. Rename via the ✎ icon.`,
    });
  };

  const send = () => {
    if (!draft.trim()) return;
    const sessionId = active.id;
    const nowIso = new Date().toISOString();
    const userMsg: ConsultMessage = {
      id: `M-x${Date.now()}`,
      role: "user",
      ts: nowIso,
      body: draft,
      tags: [],
    };

    // Pick a stable reply variant based on prior user-message count
    const priorUserCount = [
      ...(active.messages ?? []),
      ...(extrasBySession[sessionId] ?? []),
    ].filter((m) => m.role === "user").length;

    setExtrasBySession((prev) => ({
      ...prev,
      [sessionId]: [...(prev[sessionId] ?? []), userMsg],
    }));
    setLocalSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, lastAt: nowIso } : s))
    );

    const userBody = draft;
    setDraft("");
    setTyping(true);
    setTimeout(() => {
      const variant = pickReply(userBody, priorUserCount);
      const replyMsg: ConsultMessage = {
        id: `M-x${Date.now() + 1}`,
        role: "ai",
        ts: new Date().toISOString(),
        body: variant.body,
        tags: variant.tags,
      };
      setExtrasBySession((prev) => ({
        ...prev,
        [sessionId]: [...(prev[sessionId] ?? []), replyMsg],
      }));
      setLocalSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, lastAt: new Date().toISOString() }
            : s
        )
      );
      setTyping(false);
    }, 1400);
  };

  const renameSession = (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (trimmed.length === 0) return;
    setLocalSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: trimmed } : s))
    );
    toast.push({
      tone: "info",
      title: "Session renamed",
      description: trimmed,
      duration: 2500,
    });
  };

  const requestDeleteSession = (id: string, title: string) => {
    if (!id.startsWith("CS-LOC-")) return;
    setPendingDelete({ id, title });
  };

  const confirmDeleteSession = () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    const title = pendingDelete.title;
    setLocalSessions((prev) => prev.filter((s) => s.id !== id));
    setExtrasBySession((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeId === id) setActiveId(mockSessions[0].id);
    setPendingDelete(null);
    toast.push({
      tone: "warn",
      title: "Session deleted",
      description: `"${title}" removed from the desk. This cannot be undone.`,
    });
  };

  const exportActiveSession = async () => {
    const md = sessionToMarkdown(
      active,
      extrasBySession[active.id] ?? []
    );
    try {
      await navigator.clipboard.writeText(md);
      toast.push({
        tone: "success",
        title: "Session exported",
        description: `${active.id} · ${active.messages.length + (extrasBySession[active.id]?.length ?? 0)} messages · on your clipboard.`,
      });
    } catch {
      toast.push({
        tone: "error",
        title: "Export failed",
        description: "Browser denied clipboard access.",
      });
    }
  };

  return {
    draft,
    setDraft,
    typing,
    pendingDelete,
    setPendingDelete,
    startNewSession,
    send,
    renameSession,
    requestDeleteSession,
    confirmDeleteSession,
    exportActiveSession,
  };
}
