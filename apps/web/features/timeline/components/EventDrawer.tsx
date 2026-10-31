"use client";

import { useEffect } from "react";
import { formatWibDateTime } from "@/lib/cn";
import { kindBadge } from "@/features/timeline/types";
import type { TimelineEvent } from "@/features/timeline/types";

interface EventDrawerProps {
  event: TimelineEvent | null;
  onClose: () => void;
}

export function EventDrawer({ event, onClose }: EventDrawerProps) {
  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [event, onClose]);

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close event details"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 focus-visible:outline-none"
      />

      <aside className="absolute inset-y-0 right-0 flex h-full w-full flex-col bg-panel sm:max-w-md">
        <header className="flex items-start justify-between gap-3 px-5 pb-2 pt-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
            <span className={kindBadge(event.kind)}>{event.kind.replace("_", " ")}</span>
            {event.sourceCode && (
              <>
                <span className="px-1.5 text-white/20">/</span>
                {event.sourceCode}
              </>
            )}
            <span className="px-1.5 text-white/20">/</span>
            {formatWibDateTime(event.occurredAt)}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mt-1 shrink-0 rounded-full px-2.5 py-0.5 text-[18px] text-white/55 transition-colors hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <h2 className="font-num text-[28px] font-semibold leading-[32px] text-white">{event.title}</h2>

          {(event.bias || event.impact) && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.06em]">
              {event.impact && (
                <span className={event.impact === "high" ? "text-brand" : event.impact === "medium" ? "text-white/55" : "text-white/30"}>
                  {event.impact} impact
                </span>
              )}
              {event.bias && (
                <span className={event.bias === "bullish" ? "text-up" : event.bias === "bearish" ? "text-down" : "text-white/40"}>
                  {event.bias === "bullish" ? "▲ Bullish" : event.bias === "bearish" ? "▼ Bearish" : "Neutral"}
                </span>
              )}
            </div>
          )}

          {event.body && <p className="mt-4 whitespace-pre-wrap text-[15px] leading-[23px] text-white/85">{event.body}</p>}

          {event.symbols.length > 0 && (
            <div className="mt-6">
              <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Affects</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {event.symbols.map((s) => (
                  <span key={s} className="rounded-full border border-white/[0.12] px-2.5 py-0.5 text-[12px] text-white/70">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="border-t border-white/[0.07] px-5 py-3">
          {event.url ? (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border border-white/[0.14] px-3 py-1 text-[13px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              View source ↗
            </a>
          ) : (
            <span className="text-[13px] text-white/30">No external source</span>
          )}
        </footer>
      </aside>
    </div>
  );
}
