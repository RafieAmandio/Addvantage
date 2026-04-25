"use client";

import { cn } from "@/lib/cn";

/**
 * Fixed-position mode indicator overlay ("INSERT" / "NORMAL") plus a paired
 * sr-only live region so keyboard-only operators get the same feedback as
 * sighted users. The live region always renders (empty when idle) so screen
 * readers can subscribe from mount.
 */
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
            "pointer-events-none fixed left-1/2 z-[60] -translate-x-1/2 border border-lime bg-gray-2 px-4 py-2 font-mono text-[11px] uppercase tracking-widest2 text-lime shadow-[0_0_30px_rgba(245,158,11,0.3)] top-6 sm:bottom-6 sm:top-auto",
            className
          )}
        >
          ● {modeHint}
        </div>
      )}
    </>
  );
}
