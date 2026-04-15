"use client";

import { tickerItems } from "@/lib/mock/ticker";

export function MarketTicker() {
  const stream = [...tickerItems, ...tickerItems];
  return (
    <div className="overflow-hidden border-y border-ink-3 bg-ink-2/60">
      <div className="flex animate-ticker whitespace-nowrap py-2 will-change-transform">
        {stream.map((it, i) => (
          <span
            key={`${it.sym}-${i}`}
            className="flex items-center gap-2 px-6 font-mono text-[11px] uppercase tracking-widest2"
          >
            <span className="text-paper/50">{it.sym}</span>
            <span className="text-paper">{it.val}</span>
            <span
              className={
                it.dir === "up" ? "text-moss" : "text-amber"
              }
            >
              {it.dir === "up" ? "▲" : "▼"} {it.chg}
            </span>
            <span className="text-amber/30">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}
