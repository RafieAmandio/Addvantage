"use client";

import { memo } from "react";
import Link from "next/link";
import { Highlight } from "@/components/ui/Highlight";
import type { Primer } from "@/features/education/types";

interface PrimerCardProps {
  primer: Primer;
  query: string;
  locked: boolean;
  read: boolean;
  indexLabel: string;
}

function PrimerCardImpl({ primer: p, query, locked, read, indexLabel }: PrimerCardProps) {
  return (
    <Link
      href={`/app/education/${p.id}`}
      className="group relative col-span-12 bg-black p-8 transition-all hover:-translate-y-px hover:bg-gray-2 sm:col-span-6 lg:col-span-4"
    >
      {read && !locked && (
        <div className="absolute right-0 top-0 bg-moss/15 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-moss">
          ✓ READ
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          <Highlight text={p.id} query={query} />
        </div>
        <div
          className={
            "font-mono text-[9px] uppercase tracking-widest2 " +
            (locked ? "text-red-500" : "text-moss")
          }
        >
          ● {locked ? "LOCKED" : "OPEN"}
        </div>
      </div>
      <h3
        className={
          "mt-6 font-display text-3xl leading-tight transition-colors " +
          (read && !locked ? "text-white/60" : "text-white")
        }
      >
        <Highlight text={p.title} query={query} />
      </h3>
      <div className="mt-1 font-mono text-[10px] italic uppercase tracking-widest2 text-brand/70">
        <Highlight text={p.framework} query={query} />
      </div>
      <p className="mt-4 text-sm text-white/70">
        <Highlight text={p.summary} query={query} />
      </p>
      <div className="mt-6 flex items-center justify-between border-t border-gray-3 pt-3">
        <div className="flex flex-wrap gap-1">
          {p.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="font-mono text-[9px] uppercase tracking-widest2 text-brand/60"
            >
              #<Highlight text={t} query={query} />
            </span>
          ))}
        </div>
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          {p.readingMin} min · {indexLabel}
        </div>
      </div>
    </Link>
  );
}

export const PrimerCard = memo(PrimerCardImpl);
