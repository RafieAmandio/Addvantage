import Link from "next/link";
import { cn } from "@/lib/cn";
import type { AtrPair } from "@/features/atr/types";

export function fmtPrice(n: number) {
  const d = n >= 1000 ? 2 : n >= 10 ? 3 : 5;
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function dayChange(p: AtrPair) {
  const last = p.price ?? p.dailyClose;
  return p.dailyOpen ? ((last - p.dailyOpen) / p.dailyOpen) * 100 : 0;
}

function ago(iso: string | null) {
  if (!iso) return null;
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

/** Kalshi "weekly forecasts" strip, fed by the ATR scanner's last price vs daily open. */
export function PriceStrip({ pairs, updatedAt }: { pairs: AtrPair[]; updatedAt: string | null }) {
  const rows = [...pairs].sort((a, b) => (a.tier === b.tier ? 0 : a.tier === "primary" ? -1 : 1)).slice(0, 16);
  if (rows.length === 0) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="hidden shrink-0 flex-col sm:flex">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">Prices</span>
        {ago(updatedAt) && <span className="text-[11px] text-white/30">{ago(updatedAt)}</span>}
      </div>
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {rows.map((p) => {
          const ch = dayChange(p);
          const sym = p.symbol.replace("/", "");
          return (
            <Link
              key={p.symbol}
              href={`/app/instrument/${encodeURIComponent(sym)}`}
              className="flex shrink-0 items-baseline gap-2 rounded-full border border-white/[0.14] px-3.5 py-2 text-[14px] transition-colors hover:border-white/30 hover:bg-panel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <span className="font-semibold text-white">{sym}</span>
              <span className="text-white/90">{fmtPrice(p.price ?? p.dailyClose)}</span>
              <span className={cn("text-[12px] font-medium", ch >= 0 ? "text-up" : "text-down")}>
                {ch >= 0 ? "▲" : "▼"} {Math.abs(ch).toFixed(2)}%
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
