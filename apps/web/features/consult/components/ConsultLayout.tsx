"use client";

import { useRef } from "react";
import type { ConsultMessage, ConsultSession } from "@/features/consult/types";
import { Bubble } from "@/features/consult/components/Bubble";
import { ScrollableConversation } from "@/features/consult/components/ScrollableConversation";

function shortSessionCode(id: string): string {
  if (id.length <= 10) return id;
  return `CS-LOC-${id.slice(0, 4).toUpperCase()}`;
}

export function ConsultLayout({
  messages,
  active,
  draft,
  setDraft,
  send,
  sendImage,
  uploadingImage,
  endRef,
  onExportSession,
}: {
  messages: ConsultMessage[];
  active: ConsultSession;
  draft: string;
  setDraft: (s: string) => void;
  send: () => void;
  sendImage: (file: File) => void;
  uploadingImage: boolean;
  endRef: React.RefObject<HTMLDivElement>;
  onExportSession: () => void;
}) {
  const awaitingReply = active.status === "awaiting_reply";
  const hasSession = active.id !== "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="mx-auto flex h-[75vh] w-full flex-col border border-gray-3">
      <div className="border-b border-gray-3 bg-gray-2/40 px-5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                {hasSession ? shortSessionCode(active.id) : "● NEW SESSION"}
              </div>
            </div>
            <div className="mt-1 font-display text-lg text-white">
              {hasSession ? active.title : "Consultation"}
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
          {hasSession && (
            <button
              onClick={onExportSession}
              title="Copy this session as markdown"
              aria-label="Export session as markdown"
              className="shrink-0 border border-gray-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              ⇩ EXPORT MD
            </button>
          )}
        </div>
      </div>

      <ScrollableConversation bottomRef={endRef} messages={messages}>
        {messages.length === 0 && (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
              ● SESSION READY · AWAITING FIRST TRANSMISSION
            </div>
            <div className="mt-4 max-w-sm font-display text-xl italic text-white/70">
              The desk is standing by. Describe your situation and a founder
              will respond.
            </div>
            <div className="mt-4 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
              Typical response time: within a few hours during market sessions.
            </div>
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
        {awaitingReply && (
          <div className="mt-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
            <span className="led animate-pulse" aria-hidden />
            Awaiting desk response
          </div>
        )}
        <div ref={endRef} />
      </ScrollableConversation>

      <div className="border-t border-gray-3 bg-gray-2/40 p-4">
        <div className="flex items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) sendImage(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            title="Attach an image"
            aria-label="Attach an image"
            className="border border-gray-3 px-4 py-3 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadingImage ? "···" : "＋ IMG"}
          </button>
          <textarea
            data-consult-input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onPaste={(e) => {
              const file = Array.from(e.clipboardData.items)
                .find((it) => it.type.startsWith("image/"))
                ?.getAsFile();
              if (file) {
                e.preventDefault();
                sendImage(file);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              } else if (e.key === "Escape") {
                e.preventDefault();
                (e.target as HTMLTextAreaElement).blur();
                window.dispatchEvent(
                  new CustomEvent("ants:consult-normal-mode")
                );
              }
            }}
            rows={2}
            placeholder="Describe your situation. Include position size, entry, stop, and what you're feeling about it…"
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
          <span>● Encrypted · TradeVantage-internal · Session-only</span>
          <span>{uploadingImage ? "Uploading image…" : "Enter to send · ＋ IMG or paste to attach"}</span>
        </div>
      </div>
    </section>
  );
}
