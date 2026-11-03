import { forwardRef } from "react";
import { cn } from "@/lib/cn";

/**
 * A printed sheet on the desk: white stock, an Ink hairline edge, a caption line in mono across
 * the top (what it is, and one fact on the right). No window, no buttons in the corner.
 */
export const Sheet = forwardRef<HTMLDivElement, { title: string; meta?: React.ReactNode; className?: string; children: React.ReactNode }>(function Sheet(
  { title, meta, className, children },
  ref,
) {
  return (
    <div ref={ref} className={cn("relative flex min-w-0 flex-col border border-tv-ink bg-tv-white text-tv-ink", className)}>
      <div className="flex items-baseline justify-between gap-3 border-b border-tv-stone px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em]">
        <span className="truncate">{title}</span>
        {meta}
      </div>
      {children}
    </div>
  );
});
