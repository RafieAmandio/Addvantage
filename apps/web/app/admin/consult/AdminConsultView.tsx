"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn, formatDate } from "@/lib/cn";
import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import { Bubble } from "@/features/consult/components/Bubble";
import { ScrollableConversation } from "@/features/consult/components/ScrollableConversation";
import type { ConsultMessage, ConsultMessageRow } from "@/features/consult/types";
import type { AdminConsultSession, AdminConsultStats } from "@/features/consult/queries/admin";
import { rowToMessage } from "@/features/consult/lib/mappers";
import { TextTabs } from "@/components/ui/TextTabs";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "text-up" },
  awaiting_reply: { label: "Awaiting reply", color: "text-brand" },
  closed: { label: "Closed", color: "text-white/30" },
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
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open", value: stats.open, color: "text-white" },
          { label: "Awaiting reply", value: stats.awaitingReply, color: "text-brand" },
          { label: "Unread", value: stats.unread, color: stats.unread > 0 ? "text-down" : "text-white" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl bg-panel px-5 py-4">
            <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{k.label}</div>
            <div className={cn("mt-1 font-num text-[32px] font-semibold leading-none", k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Session list */}
        <aside className="flex min-w-0 flex-col rounded-2xl bg-panel p-5 lg:max-h-[75vh]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-white">Sessions</h2>
            <TextTabs
              label="Filter sessions"
              value={filter}
              onChange={setFilter}
              options={[
                { id: "all", label: "All" },
                { id: "awaiting_reply", label: "Awaiting" },
                { id: "closed", label: "Closed" },
              ]}
            />
          </div>
          <div className="-mx-5 max-h-[50vh] divide-y divide-white/[0.07] overflow-y-auto border-t border-white/[0.07] lg:max-h-none">
            {filteredSessions.length === 0 && (
              <p className="px-5 py-8 text-center text-[14px] text-white/40">No sessions</p>
            )}
            {filteredSessions.map((s) => {
              const statusInfo = STATUS_LABELS[s.status] ?? STATUS_LABELS.open;
              const active = s.id === activeId;
              return (
                <button
                  key={s.id}
                  onClick={() => selectSession(s.id)}
                  aria-current={active || undefined}
                  className={cn(
                    "block w-full px-5 py-3 text-left transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-brand",
                    active && "bg-raised shadow-[inset_2px_0_0_#FFD400]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] text-white/55">{s.user.handle ?? s.user.email}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {s.unreadAdmin && <span className="inline-block h-2 w-2 bg-brand" title="Unread" />}
                      <span className={cn("text-[12px] font-medium", statusInfo.color)}>{statusInfo.label}</span>
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[14px] font-medium text-white">{s.title}</div>
                  <div className="mt-0.5 text-[12px] text-white/30">
                    {formatDate(s.updatedAt)} · {s._count.messages} msgs
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Conversation */}
        <section className={cn("flex min-w-0 flex-col overflow-hidden rounded-2xl bg-panel lg:h-[75vh]", activeSession ? "h-[75vh]" : "h-40")}>
          {!activeSession ? (
            <div className="flex h-full items-center justify-center text-[14px] text-white/40">
              Select a session to view
            </div>
          ) : (
            <>
              <div className="border-b border-white/[0.07] px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-white/55">
                      {activeSession.user.handle ?? activeSession.user.email}
                    </div>
                    <div className="mt-0.5 text-[17px] font-semibold leading-[24px] text-white">{activeSession.title}</div>
                    <div
                      className={cn(
                        "mt-0.5 text-[12px] font-medium",
                        STATUS_LABELS[activeSession.status]?.color ?? "text-white/30",
                      )}
                    >
                      {STATUS_LABELS[activeSession.status]?.label ?? activeSession.status}
                    </div>
                  </div>
                  {activeSession.status !== "closed" && (
                    <button
                      onClick={closeSession}
                      className="shrink-0 rounded-full border border-white/[0.14] px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-raised hover:text-down focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                    >
                      Close session
                    </button>
                  )}
                </div>
              </div>

              <ScrollableConversation bottomRef={endRef} messages={messages}>
                {messages.length === 0 && (
                  <div className="flex h-full min-h-[200px] items-center justify-center text-[14px] text-white/40">
                    No messages yet
                  </div>
                )}
                {messages.map((m) => (
                  <Bubble key={m.id} msg={m} />
                ))}
                <div ref={endRef} />
              </ScrollableConversation>

              {activeSession.status !== "closed" && (
                <div className="border-t border-white/[0.07] p-4">
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
                      aria-label="Reply"
                      placeholder="Reply as the desk"
                      className="min-w-0 flex-1 resize-none rounded-xl bg-raised px-4 py-3 text-[15px] leading-[22px] text-white outline-none ring-1 ring-white/[0.08] placeholder:text-white/25 focus-visible:ring-brand"
                    />
                    <button
                      onClick={sendReply}
                      disabled={sending || !draft.trim()}
                      className="inline-flex h-11 shrink-0 items-center rounded-full bg-brand px-5 text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      {sending ? "Sending" : "Reply"}
                    </button>
                  </div>
                  <div className="mt-2 text-[12px] text-white/30">Enter to send, Shift+Enter for a new line</div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
