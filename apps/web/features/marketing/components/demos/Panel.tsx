import { forwardRef } from "react";
import { cn } from "@/lib/cn";

/** The frame every demo plays in: a terminal-ish title bar over a dark panel. */
export const Panel = forwardRef<HTMLDivElement, { title: string; meta?: React.ReactNode; className?: string; children: React.ReactNode }>(function Panel(
  { title, meta, className, children },
  ref,
) {
  return (
    <div ref={ref} className={cn("relative flex min-w-0 flex-col overflow-hidden rounded-[10px] border border-white/15 bg-panel text-white", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/70">
        <span className="flex items-center gap-2 truncate">
          <span className="flex gap-1" aria-hidden>
            <i className="h-2 w-2 rounded-full bg-white/20" />
            <i className="h-2 w-2 rounded-full bg-white/20" />
            <i className="h-2 w-2 rounded-full bg-brand" />
          </span>
          {title}
        </span>
        {meta}
      </div>
      {children}
    </div>
  );
});

/** Where a scripted pointer sits, in % of its positioned parent. Hidden under reduced motion. */
export function Pointer({ x, y, show, tap }: { x: number; y: number; show: boolean; tap?: boolean }) {
  return (
    <span aria-hidden className="lv-cursor pointer-events-none absolute z-20" style={{ left: `${x}%`, top: `${y}%`, opacity: show ? 1 : 0 }}>
      {tap && <span key={`${x}-${y}`} className="lv-tap absolute left-0 top-0 h-8 w-8 rounded-full border-2 border-brand" />}
      <svg width="20" height="22" viewBox="0 0 20 22" className="drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]">
        <path d="M2 1.5 L2 17 L6.2 13.2 L9 20 L12 18.8 L9.3 12.2 L15 12.2 Z" fill="#FFD400" stroke="#0A0A0A" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
