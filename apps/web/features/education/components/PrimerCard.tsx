"use client";

import { memo } from "react";
import Link from "next/link";
import { Highlight } from "@/components/ui/Highlight";
import { cn } from "@/lib/cn";
import type { Primer } from "@/features/education/types";

interface PrimerCardProps {
  primer: Primer;
  query: string;
  locked: boolean;
  read: boolean;
}

/** Library row: eyebrow, title, framework, summary, tags; status at the end. */
function PrimerCardImpl({ primer: p, query, locked, read }: PrimerCardProps) {
  return (
    <Link
      href={`/app/education/${p.id}`}
      className="group flex gap-4 py-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
          <Highlight text={p.id} query={query} />
          <span className="px-1.5 text-white/20">/</span>
          {p.readingMin} min
          <span className="px-1.5 text-white/20">/</span>
          <span className="normal-case tracking-normal text-brand/80">
            <Highlight text={p.framework} query={query} />
          </span>
        </p>
        <h3
          className={cn(
            "mt-1 text-[17px] font-medium leading-6 transition-colors group-hover:text-white",
            read && !locked ? "text-white/55" : "text-white",
          )}
        >
          <Highlight text={p.title} query={query} />
        </h3>
        <p className="mt-1 line-clamp-2 text-[14px] leading-[21px] text-white/55">
          <Highlight text={p.summary} query={query} />
        </p>
        {p.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] text-white/60">
                #<Highlight text={t} query={query} />
              </span>
            ))}
          </div>
        )}
      </div>
      <span
        className={cn(
          "shrink-0 self-center text-[12px] font-semibold uppercase tracking-[0.06em]",
          locked ? "text-brand" : read ? "text-up" : "text-white/30",
        )}
      >
        {locked ? "VIP+" : read ? "✓ Read" : "Open"}
      </span>
    </Link>
  );
}

export const PrimerCard = memo(PrimerCardImpl);
