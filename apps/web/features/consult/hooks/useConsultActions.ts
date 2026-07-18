"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { sessionToMarkdown } from "@/features/consult/lib/export";
import {
  createConsultSession,
  renameConsultSession,
  deleteConsultSession,
  appendConsultMessage,
  uploadConsultImage,
} from "@/features/consult/actions";
import type { ConsultMessage, ConsultSession, LocalSession } from "@/features/consult/types";
import { useToast } from "@/lib/toast";

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // One session per account. If no session exists yet, open the single session
  // for this account (the only entry point for session creation — no parallel
  // sessions can be spawned). Returns the session id, or null on failure
  // (a toast is surfaced here so callers can just bail).
  const ensureSession = async (): Promise<string | null> => {
    if (active.id) return active.id;

    const res = await createConsultSession("Consultation");
    if (!res.ok || !res.sessionId) {
      toast.push({
        tone: "error",
        title: "Could not open session",
        description:
          res.error === "rate_limited"
            ? "Too many new sessions — slow down."
            : "Failed to reach the desk. Try again.",
      });
      return null;
    }

    const sessionId = res.sessionId;
    const openedAt = new Date().toISOString();
    const session: LocalSession = {
      id: sessionId,
      title: "Consultation",
      startedAt: openedAt,
      lastAt: openedAt,
      tags: [],
      messages: [],
    };
    setLocalSessions([session]);
    setActiveId(sessionId);
    return sessionId;
  };

  const send = async () => {
    if (!draft.trim()) return;
    const userBody = draft;

    const sessionId = await ensureSession();
    if (!sessionId) return;

    const nowIso = new Date().toISOString();
    const userMsg: ConsultMessage = {
      id: `M-x${Date.now()}`,
      role: "user",
      ts: nowIso,
      body: userBody,
      tags: [],
    };

    setExtrasBySession((prev) => ({
      ...prev,
      [sessionId]: [...(prev[sessionId] ?? []), userMsg],
    }));
    setLocalSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, lastAt: nowIso, status: "awaiting_reply" } : s))
    );

    setDraft("");

    appendConsultMessage({
      sessionId,
      role: "user",
      content: userBody,
    }).then((res) => {
      if (!res.ok) {
        toast.push({
          tone: "error",
          title: "Message not sent",
          description: "Failed to reach the desk. Try again.",
          duration: 3500,
        });
      }
    }).catch(() => {
      toast.push({
        tone: "error",
        title: "Message not sent",
        description: "Network error reaching the desk. Try again.",
        duration: 3500,
      });
    });
  };

  const sendImage = async (file: File) => {
    if (uploadingImage) return;

    // Mirror the API's storage allowlist + 5 MB cap (integrations/storage).
    const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.push({
        tone: "error",
        title: "Unsupported file",
        description: "Attach a PNG, JPEG, WebP, or GIF image.",
      });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.push({
        tone: "error",
        title: "Image too large",
        description: "Max 5 MB per image.",
      });
      return;
    }

    const sessionId = await ensureSession();
    if (!sessionId) return;

    setUploadingImage(true);
    const nowIso = new Date().toISOString();
    const previewUrl = URL.createObjectURL(file);
    const userMsg: ConsultMessage = {
      id: `M-x${Date.now()}`,
      role: "user",
      ts: nowIso,
      body: `[image: ${file.name}]`,
      tags: [],
      image: { url: previewUrl, name: file.name, contentType: file.type },
    };

    setExtrasBySession((prev) => ({
      ...prev,
      [sessionId]: [...(prev[sessionId] ?? []), userMsg],
    }));
    setLocalSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, lastAt: nowIso, status: "awaiting_reply" } : s))
    );

    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await uploadConsultImage(sessionId, fd);
      if (!res.ok) {
        toast.push({
          tone: "error",
          title: "Image not sent",
          description: "Failed to reach the desk. Try again.",
          duration: 3500,
        });
      }
    } catch {
      toast.push({
        tone: "error",
        title: "Image not sent",
        description: "Network error reaching the desk. Try again.",
        duration: 3500,
      });
    } finally {
      // Poll replaces `extras` with the authoritative server copy (real URL)
      // within ~10s, so the optimistic blob preview is transient.
      setUploadingImage(false);
    }
  };

  const renameSession = (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (trimmed.length === 0) return;
    setLocalSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: trimmed } : s))
    );
    renameConsultSession({ sessionId: id, title: trimmed }).catch(() => {
      /* telemetry handled server-side */
    });
    toast.push({
      tone: "info",
      title: "Session renamed",
      description: trimmed,
      duration: 2500,
    });
  };

  const isUserSession = () => true;

  const requestDeleteSession = (id: string, title: string) => {
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
    if (activeId === id) setActiveId("");
    setPendingDelete(null);
    deleteConsultSession(id).catch(() => {
      /* telemetry handled server-side */
    });
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
    uploadingImage,
    pendingDelete,
    setPendingDelete,
    send,
    sendImage,
    renameSession,
    requestDeleteSession,
    confirmDeleteSession,
    exportActiveSession,
    isUserSession,
  };
}
