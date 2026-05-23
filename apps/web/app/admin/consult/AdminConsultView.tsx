"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn, formatDate } from "@/lib/cn";
import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import { Bubble } from "@/features/consult/components/Bubble";
import { ScrollableConversation } from "@/features/consult/components/ScrollableConversation";
import type { ConsultMessage, ConsultMessageRow } from "@/features/consult/types";
import type { AdminConsultSession, AdminConsultStats } from "@/features/consult/queries/admin";
import { rowToMessage } from "@/features/consult/lib/mappers";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: "OPEN", color: "text-moss" },
  awaiting_reply: { label: "AWAITING", color: "text-brand" },
  closed: { label: "CLOSED", color: "text-white/30" },
};

type FilterTab = "all" | "awaiting_reply" | "closed";

export function AdminConsultView({
  initialSessions,
  initialMessages,
  initialActiveId,
  stats,
}: {
  initialSessions: AdminConsultSession[];
  initialMessages: ConsultMessageRow[];
  initialActiveId?: string;
  stats: AdminConsultStats;
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [activeId, setActiveId] = useState(initialActiveId ?? "");
  const [messages, setMessages] = useState<ConsultMessage[]>(
    initialMessages.map(rowToMessage)
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const endRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeId);

  const filteredSessions = sessions.filter((s) => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  const selectSession = useCallback(async (sessionId: string) => {
    setActiveId(sessionId);
    try {
      const msgs = await apiGet<ConsultMessageRow[]>(
        `/consult/admin/sessions/${sessionId}/messages`
      );
      setMessages(msgs.map(rowToMessage));
    } catch {
      setMessages([]);
    }
  }, []);

  const sendReply = async () => {
    if (!draft.trim() || !activeId || sending) return;
    setSending(true);
    const content = draft;
    setDraft("");

    const optimistic: ConsultMessage = {
      id: `M-admin-${Date.now()}`,
      role: "admin",
      ts: new Date().toISOString(),
      body: content,
      tags: [],
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await apiPost(`/consult/admin/sessions/${activeId}/messages`, { content });
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
            ? { ...s, status: "open", unreadAdmin: false, updatedAt: new Date().toISOString() }
            : s
        )
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  const closeSession = async () => {
    if (!activeId) return;
    try {
      await apiPut(`/consult/admin/sessions/${activeId}/close`);
      setSessions((prev) =>
        prev.map((s) => (s.id === activeId ? { ...s, status: "closed" } : s))
      );
    } catch {
      // silent
    }
  };

  const lastTsRef = useRef<string>(new Date(0).toISOString());
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last) lastTsRef.current = last.ts;
  }, [messages]);

  useEffect(() => {
    if (!activeId) return;
    const poll = async () => {
      try {
        const result = await apiGet<{ hasNew: boolean; latestAt: string | null }>(
          `/consult/sessions/${activeId}/poll?after=${encodeURIComponent(lastTsRef.current)}`
        );
        if (result.hasNew) {
          const msgs = await apiGet<ConsultMessageRow[]>(
            `/consult/admin/sessions/${activeId}/messages`
          );
          setMessages(msgs.map(rowToMessage));
          if (result.latestAt) lastTsRef.current = result.latestAt;
        }
      } catch {
        // silent
      }
    };
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, [activeId]);

  // Poll session list for updates
  useEffect(() => {
    const poll = async () => {
      try {
        const data = await apiGet<AdminConsultSession[]>("/consult/admin/sessions");
        setSessions(data);
      } catch {
        // silent
      }
    };
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div>
      {/* Stats header */}
      <div className="mb-6 flex flex-wrap items-center gap-6 font-mono text-[10px] uppercase tracking-widest2">
        <span className="text-white/40">
          Open: <span className="text-moss">{stats.open}</span>
        </span>
        <span className="text-white/40">
          Awaiting reply: <span className="text-brand">{stats.awaitingReply}</span>
        </span>
        <span className="text-white/40">
          Unread: <span className="text-blood-bright">{stats.unread}</span>
        </span>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-3 font-mono text-[10px] uppercase tracking-widest2">
        {(["all", "awaiting_reply", "closed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "border px-3 py-1 transition-colors",
              filter === tab
                ? "border-brand bg-brand/10 text-brand"
                : "border-gray-3 text-white/40 hover:text-white"
            )}
          >
            {tab === "all" ? "ALL" : tab === "awaiting_reply" ? "AWAITING" : "CLOSED"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Session list */}
        <aside className="col-span-12 lg:col-span-4 max-h-[75vh] overflow-y-auto space-y-px bg-gray-3">
          {filteredSessions.length === 0 && (
            <div className="bg-black p-6 text-center font-mono text-[10px] uppercase tracking-widest2 text-white/30">
              No sessions
            </div>
          )}
          {filteredSessions.map((s) => {
            const statusInfo = STATUS_LABELS[s.status] ?? STATUS_LABELS.open;
            return (
              <button
                key={s.id}
                onClick={() => selectSession(s.id)}
                className={cn(
                  "block w-full bg-black p-3 text-left transition-colors hover:bg-gray-2",
                  s.id === activeId && "border-l-2 border-brand bg-gray-2"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/50">
                    {s.user.handle ?? s.user.email}
                  </span>
                  <div className="flex items-center gap-2">
                    {s.unreadAdmin && (
                      <span className="inline-block h-2 w-2 rounded-full bg-brand" title="Unread" />
                    )}
                    <span className={cn("font-mono text-[8px] uppercase tracking-widest2", statusInfo.color)}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-sm text-white truncate">{s.title}</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
                  {formatDate(s.updatedAt)} · {s._count.messages} msgs
                </div>
              </button>
            );
          })}
        </aside>

        {/* Conversation */}
        <section className="col-span-12 flex h-[75vh] flex-col border border-gray-3 lg:col-span-8">
          {!activeSession ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center font-mono text-[10px] uppercase tracking-widest2 text-white/30">
                Select a session to view
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-gray-3 bg-gray-2/40 px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/50">
                      {activeSession.user.handle ?? activeSession.user.email}
                    </div>
                    <div className="mt-1 font-display text-lg text-white">
                      {activeSession.title}
                    </div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2">
                      <span className={STATUS_LABELS[activeSession.status]?.color ?? "text-white/30"}>
                        {STATUS_LABELS[activeSession.status]?.label ?? activeSession.status}
                      </span>
                    </div>
                  </div>
                  {activeSession.status !== "closed" && (
                    <button
                      onClick={closeSession}
                      className="shrink-0 border border-gray-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-blood hover:text-blood-bright focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                    >
                      Close Session
                    </button>
                  )}
                </div>
              </div>

              <ScrollableConversation bottomRef={endRef} messages={messages}>
                {messages.length === 0 && (
                  <div className="flex h-full min-h-[200px] items-center justify-center">
                    <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
                      No messages yet
                    </div>
                  </div>
                )}
                {messages.map((m) => (
                  <Bubble key={m.id} msg={m} />
                ))}
                <div ref={endRef} />
              </ScrollableConversation>

              {activeSession.status !== "closed" && (
                <div className="border-t border-gray-3 bg-gray-2/40 p-4">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                      rows={2}
                      placeholder="Reply as the desk…"
                      className="flex-1 resize-none border border-gray-3 bg-black p-3 font-mono text-sm text-white placeholder:text-white/30 outline-none transition-colors focus-visible:border-brand"
                    />
                    <button
                      onClick={sendReply}
                      disabled={sending || !draft.trim()}
                      className={cn(
                        "px-5 py-3 font-mono text-[10px] uppercase tracking-widest2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
                        sending || !draft.trim()
                          ? "bg-gray-3 text-white/30 cursor-not-allowed"
                          : "bg-brand text-black hover:bg-brand-dim hover:text-white"
                      )}
                    >
                      {sending ? "Sending…" : "Reply →"}
                    </button>
                  </div>
                  <div className="mt-2 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
                    Enter to send · Shift+Enter for newline
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
