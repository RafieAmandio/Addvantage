"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface CalendarEvent {
  id: string;
  time: string;
  title: string;
  impact: "high" | "medium" | "low";
  currency: string;
}

const MOCK_EVENTS: CalendarEvent[] = [
  { id: "cal-1", time: "08:30", title: "Non-Farm Payrolls", impact: "high", currency: "USD" },
  { id: "cal-2", time: "10:00", title: "ISM Manufacturing PMI", impact: "high", currency: "USD" },
  { id: "cal-3", time: "12:30", title: "ECB Rate Decision", impact: "high", currency: "EUR" },
  { id: "cal-4", time: "14:00", title: "Consumer Sentiment", impact: "medium", currency: "USD" },
  { id: "cal-5", time: "15:15", title: "Industrial Production", impact: "medium", currency: "USD" },
  { id: "cal-6", time: "16:00", title: "Fed Chair Speech", impact: "high", currency: "USD" },
  { id: "cal-7", time: "20:00", title: "API Crude Oil Stock", impact: "low", currency: "USD" },
  { id: "cal-8", time: "23:50", title: "Japan GDP (QoQ)", impact: "medium", currency: "JPY" },
];

function getCountdown(eventTime: string): string {
  const now = new Date();
  const [h, m] = eventTime.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs < 0) return "passed";
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  if (diffH === 0) return `${diffM}m`;
  return `${diffH}h ${diffM}m`;
}

export function CalendarStrip() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  useEffect(() => {
    function update() {
      const next: Record<string, string> = {};
      for (const ev of MOCK_EVENTS) {
        next[ev.id] = getCountdown(ev.time);
      }
      setCountdowns(next);
    }
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  const impactDot: Record<string, string> = {
    high: "bg-brand",
    medium: "bg-white/50",
    low: "bg-white/20",
  };

  return (
    <section aria-label="Today's calendar" className="border-b border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-3 py-3">
          <Link
            href="/app/calendar"
            className="shrink-0 text-xs font-medium text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Calendar
          </Link>
          <div className="h-3 w-px bg-white/[0.08]" aria-hidden />
          <div className="relative flex-1 overflow-hidden">
            <div
              ref={scrollRef}
              className="flex gap-0.5 overflow-x-auto scrollbar-none"
              role="list"
              aria-label="Upcoming events"
            >
              {MOCK_EVENTS.map((ev) => {
                const cd = countdowns[ev.id];
                const past = cd === "passed";
                return (
                  <Link
                    key={ev.id}
                    href="/app/calendar"
                    role="listitem"
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-xs transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
                      past && "opacity-40",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", impactDot[ev.impact])} />
                    <span className="text-white/60">{ev.time}</span>
                    <span className="font-medium text-white/80">{ev.currency}</span>
                    <span className="max-w-[180px] truncate text-white/50">{ev.title}</span>
                    {!past && cd && (
                      <span className="text-[11px] text-brand">{cd}</span>
                    )}
                  </Link>
                );
              })}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black-2 to-transparent" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
