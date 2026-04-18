"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { consultSessions as mockSessions } from "@/features/consult/mock";
import { pickReply } from "@/features/consult/lib/replies";
import { sessionToMarkdown } from "@/features/consult/lib/export";
import {
  createConsultSession,
  sendConsultMessage,
  renameConsultSession,
  deleteConsultSession,
} from "@/features/consult/actions";
import type { LocalSession } from "@/features/consult/types";
import { useToast } from "@/lib/toast";
import type { ConsultMessage, ConsultSession } from "@/lib/mock/types";

/**
 * Encapsulates the write-side of a consult session: new/send/rename/delete/
 * export, plus the pending-delete confirm dialog state.
 *
 * Supabase is the source of truth for user-owned sessions — every mutation
 * fires the matching server action (see `features/consult/actions.ts`,
 * migration 0019) in addition to updating the localStorage-backed client
 * state. New sessions use the server-minted UUID as their local id, so a
 * subsequent page load re-hydrates the same session from Supabase.
 *
 * The localStorage path is retained as an offline-cache + a fallback for
 * when the user briefly loses connectivity. Mock/desk sessions
 * (`mockSessions`) are read-only reference material and are never persisted
 * to the DB.
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

  const startNewSession = async () => {
    const now = new Date();
    const hhmm =
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0");
    const title = `New session · ${hhmm}`;

    // Server-mint the UUID so the local cache stays consistent with the DB.
    const res = await createConsultSession(title);
    if (!res.ok || !res.sessionId) {
      toast.push({
        tone: "error",
        title: "Could not open session",
        description:
          res.error === "rate_limited"
            ? "Too many new sessions — slow down."
            : "Failed to reach the desk. Try again.",
      });
      return;
    }

    const session: LocalSession = {
      id: res.sessionId,
      title,
      startedAt: now.toISOString(),
      lastAt: now.toISOString(),
      tags: [],
      messages: [],
    };
    setLocalSessions((prev) => [session, ...prev]);
    setActiveId(res.sessionId);
    setDraft("");
    toast.push({
      tone: "success",
      title: "Session opened",
      description: `Session logged — rename via the ✎ icon.`,
    });
  };

  const send = () => {
    if (!draft.trim()) return;
    const sessionId = active.id;
    // Supabase-backed sessions are user-owned (UUID); mock sessions are not.
    // Only persist if we're in a user-owned session. The UI prevents starting
    // a send from a mock session implicitly because `startNewSession` is the
    // only path to create a new persistable session.
    const isPersistable = !mockSessions.some((s) => s.id === sessionId);

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

    const appendAssistantLocal = (body: string, tags: ConsultMessage["tags"]) => {
      const replyMsg: ConsultMessage = {
        id: `M-x${Date.now() + 1}`,
        role: "ai",
        ts: new Date().toISOString(),
        body,
        tags,
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
    };

    if (isPersistable) {
      // Real LLM path: server action persists user + assistant turns and
      // returns the assistant content. Offline/canned fallback is handled
      // server-side when OPENAI_API_KEY is unset.
      sendConsultMessage({ sessionId, body: userBody })
        .then((res) => {
          setTyping(false);
          if (res.ok) {
            appendAssistantLocal(res.assistantContent, []);
            return;
          }
          const description =
            res.error === "rate_limited"
              ? "Slow down — too many messages per minute."
              : "Desk didn't respond. Try again.";
          toast.push({
            tone: "error",
            title: "Message not sent",
            description,
            duration: 3500,
          });
        })
        .catch(() => {
          setTyping(false);
          toast.push({
            tone: "error",
            title: "Message not sent",
            description: "Network error reaching the desk. Try again.",
            duration: 3500,
          });
        });
    } else {
      // Mock/desk read-only sessions: keep the canned reply UX so the demo
      // content stays interactive without hitting the DB or LLM.
      setTimeout(() => {
        const variant = pickReply(userBody, priorUserCount);
        appendAssistantLocal(variant.body, variant.tags);
        setTyping(false);
      }, 1400);
    }
  };

  const renameSession = (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (trimmed.length === 0) return;
    setLocalSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: trimmed } : s))
    );
    const isPersistable = !mockSessions.some((s) => s.id === id);
    if (isPersistable) {
      renameConsultSession({ sessionId: id, title: trimmed }).catch(() => {
        /* telemetry handled server-side */
      });
    }
    toast.push({
      tone: "info",
      title: "Session renamed",
      description: trimmed,
      duration: 2500,
    });
  };

  const isUserSession = (id: string): boolean =>
    !mockSessions.some((s) => s.id === id);

  const requestDeleteSession = (id: string, title: string) => {
    if (!isUserSession(id)) return;
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
    // Persist deletion. Mock sessions are never in Supabase so we guard.
    if (isUserSession(id)) {
      deleteConsultSession(id).catch(() => {
        /* telemetry handled server-side */
      });
    }
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
    isUserSession,
  };
}
