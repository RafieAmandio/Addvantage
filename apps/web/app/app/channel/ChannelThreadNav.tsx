"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

interface ChannelThread {
  id: string;
  title: string;
  slug: string;
}

/** Text tabs, one per thread. Links so the server re-fetches the filtered posts. */
export function ChannelThreadNav({ threads, activeSlug }: { threads: ChannelThread[]; activeSlug: string | null }) {
  const items = [{ slug: null as string | null, title: "All" }, ...threads];
  return (
    <nav className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-medium" aria-label="Thread filter">
      {items.map((t) => (
        <Link
          key={t.slug ?? "all"}
          href={t.slug ? `/app/channel?thread=${t.slug}` : "/app/channel"}
          aria-current={activeSlug === t.slug ? "page" : undefined}
          className={cn(
            "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
            activeSlug === t.slug ? "text-white" : "text-white/30 hover:text-white/60",
          )}
        >
          {t.title}
        </Link>
      ))}
    </nav>
  );
}
