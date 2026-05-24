"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

interface ChannelThread {
  id: string;
  title: string;
  slug: string;
}

export function ChannelThreadNav({
  threads,
  activeSlug,
}: {
  threads: ChannelThread[];
  activeSlug: string | null;
}) {
  return (
    <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="Thread filter">
      <Link
        href="/app/channel"
        className={cn(
          "shrink-0 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 transition-colors",
          "focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
          !activeSlug
            ? "border-brand bg-brand text-black"
            : "border-gray-3 text-white/50 hover:border-white/30 hover:text-white"
        )}
      >
        All
      </Link>
      {threads.map((t) => (
        <Link
          key={t.id}
          href={`/app/channel?thread=${t.slug}`}
          className={cn(
            "shrink-0 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 transition-colors",
            "focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
            activeSlug === t.slug
              ? "border-brand bg-brand text-black"
              : "border-gray-3 text-white/50 hover:border-white/30 hover:text-white"
          )}
        >
          {t.title}
        </Link>
      ))}
    </nav>
  );
}
