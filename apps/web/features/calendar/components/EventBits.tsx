"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { Impact } from "@/features/calendar/types";
import { IMPACT_LABEL } from "@/features/calendar/lib/style";

/** Wall clock that re-renders every `ms`. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "in 45:20", "in 3:12:05", "in 2d 4h", or "3h ago" once released. */
export function relTime(ts: string, now: number): string {
  const d = new Date(ts).getTime() - now;
  const s = Math.floor(Math.abs(d) / 1000);
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) {
    if (days > 0) return `in ${days}d ${h}h`;
    return h > 0 ? `in ${h}:${pad(m)}:${pad(s % 60)}` : `in ${pad(m)}:${pad(s % 60)}`;
  }
  if (days > 0) return `${days}d ago`;
  if (h > 0) return `${h}h ago`;
  return m > 0 ? `${m}m ago` : "just now";
}

/** Ticking countdown to `ts`, or how long ago it was released. */
export function Countdown({ ts, className, pastPrefix = "" }: { ts: string; className?: string; pastPrefix?: string }) {
  const now = useNow(1000);
  const past = new Date(ts).getTime() <= now;
  return (
    <span className={cn("tabular-nums", className)} suppressHydrationWarning>
      {past ? pastPrefix : ""}
      {relTime(ts, now)}
    </span>
  );
}

const FILLED: Record<Impact, number> = { high: 3, medium: 2, low: 1 };
const TONE: Record<Impact, string> = { high: "bg-brand", medium: "bg-white/70", low: "bg-white/35" };

/** Three rising bars, filled by impact. */
export function ImpactBars({ impact, className }: { impact: Impact; className?: string }) {
  return (
    <span
      className={cn("inline-flex h-3 items-end gap-[2px]", className)}
      role="img"
      aria-label={`${IMPACT_LABEL[impact]} impact`}
      title={`${IMPACT_LABEL[impact]} impact`}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-[1px]", i < FILLED[impact] ? TONE[impact] : "bg-white/10")}
          style={{ height: `${5 + i * 3.5}px` }}
        />
      ))}
    </span>
  );
}
