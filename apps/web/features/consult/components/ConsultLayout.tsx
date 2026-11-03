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
    <section className="flex h-[75vh] min-h-[480px] w-full flex-col overflow-hidden rounded-2xl bg-panel">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold leading-[22px] text-white">
            {hasSession ? active.title : "New consultation"}
          </h2>
          <p className="text-[13px] leading-[18px] text-white/55">
            {hasSession ? shortSessionCode(active.id) : "Your first message opens the session"}
            {awaitingReply && <span className="ml-2 text-brand">Awaiting desk</span>}
          </p>
          {active.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {active.tags.map((t) => (
                <span key={t} className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] text-white/60">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        {hasSession && (
          <button
            onClick={onExportSession}
            title="Copy this session as markdown"
            aria-label="Export session as markdown"
            className="shrink-0 rounded-full border border-white/[0.14] px-3 py-1 text-[13px] font-medium text-white/70 transition-colors hover:bg-raised hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            Export
          </button>
        )}
      </div>

      <ScrollableConversation bottomRef={endRef} messages={messages}>
        {messages.length === 0 && (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
            <p className="max-w-sm text-[17px] font-medium leading-6 text-white">
              The desk is standing by. Describe your situation and a founder will respond.
            </p>
            <p className="mt-2 text-[13px] text-white/40">Typical response time: within a few hours during market sessions.</p>
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
        {awaitingReply && (
          <p className="flex items-center gap-2 px-1 text-[13px] text-white/40">
            <span className="led" aria-hidden />
            Awaiting desk response
          </p>
        )}
        <div ref={endRef} />
      </ScrollableConversation>

      <div className="border-t border-white/[0.07] p-3 sm:p-4">
        <div className="flex items-end gap-2 rounded-2xl bg-raised p-2 focus-within:ring-1 focus-within:ring-white/20">
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[20px] leading-none text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadingImage ? "…" : "+"}
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
            aria-label="Message the desk"
            placeholder="Describe your situation. Include position size, entry, stop, and what you're feeling about it…"
            className="min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-[22px] text-white outline-none placeholder:text-white/30"
          />
          <button
            onClick={send}
            className="h-10 shrink-0 rounded-full bg-brand px-4 text-[14px] font-semibold text-black transition-opacity hover:opacity-90 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            Send
          </button>
        </div>
        <p className="mt-2 px-1 text-[12px] text-white/30">
          {uploadingImage ? "Uploading image…" : "Enter to send, Shift+Enter for a new line. Paste or + to attach an image."}
        </p>
      </div>
    </section>
  );
}
