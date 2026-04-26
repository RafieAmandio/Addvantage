"use client";

import { useState } from "react";
import { cn, formatDate } from "@/lib/cn";
import type { ConsultMessage, ConsultSession } from "@/features/consult/types";
import { SectionNumber } from "@/components/ui/Marker";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { Bubble } from "@/features/consult/components/Bubble";
import { TypingIndicator } from "@/features/consult/components/TypingIndicator";
import { ScrollableConversation } from "@/features/consult/components/ScrollableConversation";

function shortSessionCode(id: string): string {
  if (id.length <= 10) return id;
  return `CS-LOC-${id.slice(0, 4).toUpperCase()}`;
}

export function ConsultLayout({
  sessions,
  totalSessions,
  sessionQuery,
  setSessionQuery,
  extrasBySession,
  messages,
  active,
  activeId,
  setActiveId,
  draft,
  setDraft,
  send,
  endRef,
  typing,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  onExportSession,
  isLocalSession,
}: {
  sessions: ConsultSession[];
  totalSessions: number;
  sessionQuery: string;
  setSessionQuery: (q: string) => void;
  extrasBySession: Record<string, ConsultMessage[]>;
  messages: ConsultMessage[];
  active: ConsultSession;
  activeId: string;
  setActiveId: (id: string) => void;
  draft: string;
  setDraft: (s: string) => void;
  send: () => void;
  endRef: React.RefObject<HTMLDivElement>;
  typing: boolean;
  onNewSession: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string, title: string) => void;
  onExportSession: () => void;
  isLocalSession: (id: string) => boolean;
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-12 gap-4">
      <aside className="col-span-12 lg:col-span-3">
        <div className="flex items-center justify-between">
          <SectionNumber
            n="—"
            label={
              sessionQuery
                ? `${sessions.length} / ${totalSessions} SESSIONS`
                : `SESSIONS · ${totalSessions}`
            }
          />
        </div>
        <div className="mt-3">
          <PageSearchInput
            value={sessionQuery}
            onChange={setSessionQuery}
            placeholder="Filter sessions…   (s to focus)"
            ariaLabel="Search sessions"
            matchLabel={
              sessionQuery
                ? `${sessions.length} ${sessions.length === 1 ? "MATCH" : "MATCHES"}`
                : null
            }
          />
        </div>
        <button
          onClick={onNewSession}
          className="mt-3 flex w-full items-center justify-center gap-2 border border-brand bg-brand/5 py-2 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
        >
          <span className="text-base leading-none">+</span>
          New session
        </button>
        {sessions.length === 0 && (
          <div className="mt-3 border border-gray-3 bg-black p-4 text-center">
            <div className="font-mono text-[9px] uppercase tracking-widest2 text-blood-bright">
              ● NO MATCHES
            </div>
            <div className="mt-1 font-mono text-[10px] text-white/50">
              No sessions match "{sessionQuery}".
            </div>
            <button
              onClick={() => setSessionQuery("")}
              className="mt-3 border border-brand/60 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              ✕ Clear
            </button>
          </div>
        )}
        <div className="mt-3 space-y-px bg-gray-3">
          {sessions.map((s) => {
            const msgCount =
              s.messages.length + (extrasBySession[s.id]?.length ?? 0);
            const isLocal = isLocalSession(s.id);
            const isRenaming = renamingId === s.id;
            return (
              <div
                key={s.id}
                className={cn(
                  "group relative bg-black transition-colors hover:bg-gray-2",
                  s.id === activeId && "border-l-2 border-brand bg-gray-2"
                )}
              >
                <button
                  onClick={() => !isRenaming && setActiveId(s.id)}
                  className="block w-full p-3 text-left focus-visible:ring-1 focus-visible:ring-brand focus-visible:ring-inset"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[9px] uppercase tracking-widest2 text-brand">
                      {shortSessionCode(s.id)}
                    </div>
                    {isLocal && (
                      <span className="font-mono text-[8px] uppercase tracking-widest2 text-moss">
                        ● LOCAL
                      </span>
                    )}
                  </div>
                  {isRenaming ? (
                    <input
                      autoFocus
                      defaultValue={s.title}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        onRenameSession(s.id, e.target.value);
                        setRenamingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onRenameSession(
                            s.id,
                            (e.target as HTMLInputElement).value
                          );
                          setRenamingId(null);
                        }
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="mt-1 w-full border-b border-brand bg-transparent py-0.5 font-display text-sm text-brand outline-none"
                    />
                  ) : (
                    <div className="mt-1 text-sm text-white">{s.title}</div>
                  )}
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                    {formatDate(s.lastAt)} · {msgCount} msgs
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[9px] uppercase tracking-widest2 text-brand/60"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </button>

                {isLocal && !isRenaming && (
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(s.id);
                      }}
                      title="Rename session"
                      aria-label="Rename session"
                      className="border border-gray-3 bg-gray-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/50 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(s.id, s.title);
                      }}
                      title="Delete session"
                      aria-label="Delete session"
                      className="border border-gray-3 bg-gray-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/50 transition-colors hover:border-blood hover:text-blood-bright focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <section className="col-span-12 flex h-[75vh] flex-col border border-gray-3 lg:col-span-9">
        <div className="border-b border-gray-3 bg-gray-2/40 px-5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                {shortSessionCode(active.id)}
              </div>
              <div className="mt-1 font-display text-lg text-white">
                {active.title}
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                {active.tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[9px] uppercase tracking-widest2 text-brand/60"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={onExportSession}
              title="Copy this session as markdown"
              aria-label="Export session as markdown"
              className="shrink-0 border border-gray-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              ⇩ EXPORT MD
            </button>
          </div>
        </div>

        <ScrollableConversation
          bottomRef={endRef}
          typing={typing}
          messages={messages}
        >
          {messages.length === 0 && !typing && (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                ● SESSION OPEN · AWAITING FIRST TRANSMISSION
              </div>
              <div className="mt-4 max-w-sm font-display text-xl italic text-white/70">
                The desk is standing by. Describe your situation — position
                size, entry, stop, and what you're feeling about it.
              </div>
              <div className="mt-4 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
                Transmission is one-way until you send the first message.
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}
          {typing && <TypingIndicator />}
          <div ref={endRef} />
        </ScrollableConversation>

        <div className="border-t border-gray-3 bg-gray-2/40 p-4">
          <div className="flex items-end gap-3">
            <textarea
              data-consult-input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                } else if (e.key === "Escape") {
                  // Vim-style normal mode — blur back to shortcut layer
                  e.preventDefault();
                  (e.target as HTMLTextAreaElement).blur();
                  window.dispatchEvent(
                    new CustomEvent("ants:consult-normal-mode")
                  );
                }
              }}
              rows={2}
              placeholder="Describe your situation. Include position size, entry, stop, and what you're feeling about it…  (press i to focus, esc to blur)"
              className="flex-1 resize-none border border-gray-3 bg-black p-3 font-mono text-sm text-white placeholder:text-white/30 outline-none transition-colors focus-visible:border-brand"
            />
            <button
              onClick={send}
              className="bg-brand px-5 py-3 font-mono text-[10px] uppercase tracking-widest2 text-black hover:bg-brand-dim hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Transmit →
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest2 text-white/30">
            <span>● Encrypted · ANTS-internal · Session-only</span>
            <span>Enter to send · Shift+Enter for newline</span>
          </div>
        </div>
      </section>
    </div>
  );
}
