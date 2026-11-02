"use client";

import { useNow } from "@/features/dashboard/hooks/useLive";

/** "7m ago" that keeps counting while the page is open. */
export function ago(iso: string, now: number) {
  const m = Math.round((now - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

export function Ago({ iso, every = 15_000, className }: { iso: string; every?: number; className?: string }) {
  const now = useNow(every);
  return (
    <span className={className} suppressHydrationWarning>
      {ago(iso, now)}
    </span>
  );
}
