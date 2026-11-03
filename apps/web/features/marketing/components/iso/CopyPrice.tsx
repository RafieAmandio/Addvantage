"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** A price you can copy: click or Enter copies the exact text, the label says so for a moment. */
export function CopyPrice({ text, className, children }: { text: string; className?: string; children: React.ReactNode }) {
  const [done, setDone] = useState(false);
  const t = useRef<number>();
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <button
      type="button"
      className={cn("tv-copy", className)}
      data-done={done || undefined}
      aria-label={`Copy ${text}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          return;
        }
        setDone(true);
        clearTimeout(t.current);
        t.current = window.setTimeout(() => setDone(false), 1400);
      }}
    >
      <span className="tv-copy-value">{children}</span>
      <span className="tv-copy-done" aria-hidden>
        Copied
      </span>
      <span className="sr-only" aria-live="polite">
        {done ? `${text} copied` : ""}
      </span>
    </button>
  );
}
