"use client";

import { cn } from "@/lib/cn";

export function ConsultModeHint({
  modeHint,
  className,
}: {
  modeHint: string | null;
  className?: string;
}) {
  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {modeHint ? `${modeHint} mode` : ""}
      </div>
      {modeHint && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none fixed left-1/2 top-6 z-[60] -translate-x-1/2 rounded-full bg-raised px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-brand ring-1 ring-white/[0.1] sm:bottom-6 sm:top-auto",
            className
          )}
        >
          {modeHint}
        </div>
      )}
    </>
  );
}
