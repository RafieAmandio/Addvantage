import { forwardRef } from "react";
import { cn } from "@/lib/cn";

/**
 * A printed sheet lying on the desk: white stock with the kit's flat floor shadow (offset down
 * and right, no blur), crop marks at the corners, a mono caption line across the top. No window,
 * no border box, no buttons in the corner.
 */
export const Sheet = forwardRef<HTMLDivElement, { title: string; meta?: React.ReactNode; className?: string; children: React.ReactNode }>(function Sheet(
  { title, meta, className, children },
  ref,
) {
  return (
    <div ref={ref} className={cn("tv-sheet relative flex min-w-0 flex-col bg-tv-white text-tv-ink", className)}>
      <div className="flex items-baseline justify-between gap-3 px-4 pb-1 pt-3 font-mono text-[11px] uppercase tracking-[0.08em]">
        <span className="truncate">{title}</span>
        {meta}
      </div>
      {children}
    </div>
  );
});
