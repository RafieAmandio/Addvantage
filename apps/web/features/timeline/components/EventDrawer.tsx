"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";
import type { TimelineEvent } from "@/features/timeline/types";

export interface EventDrawerProps {
  event: TimelineEvent | null;
  onClose: () => void;
}

function kindBadge(kind: TimelineEvent["kind"]): string {
  switch (kind) {
    case "news":
      return "bg-brand/15 text-brand";
    case "tweet":
      return "bg-brand/10 text-brand/70";
    case "macro":
      return "bg-blood/15 text-red-500";
    case "earnings":
      return "bg-moss/15 text-moss";
    case "user_pin":
      return "bg-white/15 text-white/70";
  }
}

function biasColor(bias: TimelineEvent["bias"]): string {
  switch (bias) {
    case "bullish":
      return "bg-brand/15 text-brand";
    case "bearish":
      return "bg-blood/15 text-red-500";
    case "neutral":
      return "bg-white/15 text-white/70";
    default:
      return "bg-white/10 text-white/50";
  }
}

function impactColor(impact: TimelineEvent["impact"]): string {
  switch (impact) {
    case "high":
      return "bg-blood/15 text-red-500";
    case "medium":
      return "bg-brand/15 text-brand";
    case "low":
      return "bg-white/15 text-white/70";
    default:
      return "bg-white/10 text-white/50";
  }
}

function formatOccurredAt(iso: string): string {
  // Show ISO minute precision in UTC — consistent with EventCard style.
  return iso.slice(0, 16).replace("T", " ") + " UTC";
}

export function EventDrawer({ event, onClose }: EventDrawerProps) {
  // Escape-to-close. Bound only while open so a background drawer doesn't
  // steal key events from whatever else is on screen.
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
        className="absolute inset-0 cursor-default bg-gray-1/70"
      />

      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex h-full w-full flex-col border-l border-gray-3 bg-gray-2",
          "sm:max-w-md",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-gray-3 px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2",
                  kindBadge(event.kind),
                )}
              >
                {event.kind}
              </span>
              {event.source_code && (
                <span className="font-mono text-[9px] uppercase tracking-widest2 text-brand">
                  [{event.source_code}]
                </span>
              )}
              <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                {formatOccurredAt(event.occurred_at)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 border border-gray-3 px-2 py-0.5 font-mono text-sm text-white/70 hover:bg-gray-3 hover:text-white"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h2 className="font-display text-2xl leading-tight text-white">
            {event.title}
          </h2>

          {(event.bias || event.impact) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {event.bias && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2",
                    biasColor(event.bias),
                  )}
                >
                  bias · {event.bias}
                </span>
              )}
              {event.impact && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2",
                    impactColor(event.impact),
                  )}
                >
                  impact · {event.impact}
                </span>
              )}
            </div>
          )}

          {event.body && (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/90">
              {event.body}
            </p>
          )}

          {event.symbols.length > 0 && (
            <div className="mt-5">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                Affects
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {event.symbols.map((s) => (
                  <span
                    key={s}
                    className="border border-gray-3 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest2 text-white/80"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="border-t border-gray-3 px-5 py-3">
          {event.url ? (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:underline"
            >
              View source →
            </a>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
              No external source
            </span>
          )}
        </footer>
      </aside>
    </div>
  );
}
