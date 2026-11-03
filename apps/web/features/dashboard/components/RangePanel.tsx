import Link from "next/link";
import { cn } from "@/lib/cn";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Panel, PanelLink } from "@/components/ui/Panel";
import type { AtrPair } from "@/features/atr/types";
import { dayChange, fmtPrice } from "./PriceStrip";

/**
 * Pairs that have used the most of their daily ATR: Celsis "today's movers" with ATR context. Bars share one scale with
 * a tick at 100%; whatever a pair travelled past its ATR is the yellow overrun.
 */
export function RangePanel({ pairs }: { pairs: AtrPair[] }) {
  const rows = [...pairs].sort((a, b) => b.exhaustionPct - a.exhaustionPct).slice(0, 6);
  const scale = Math.max(100, ...rows.map((p) => p.exhaustionPct));
  const at = (v: number) => `${(v / scale) * 100}%`;
  return (
    <Panel title="Range used" sub="Share of the daily ATR already travelled" action={<PanelLink href="/app/atr">ATR</PanelLink>} className="surface-hover">
      {rows.length === 0 ? (
        <p className="py-6 text-[14px] text-white/40">ATR data isn&apos;t available right now.</p>
      ) : (
        <ul className="-my-1 divide-y divide-white/[0.07]">
          {rows.map((p, i) => {
            const ch = dayChange(p);
            const used = Math.round(p.exhaustionPct);
            const sym = p.symbol.replace("/", "");
            return (
              <li key={p.symbol} className="enter-row" style={{ "--i": i } as React.CSSProperties}>
                <Link
                  href={`/app/instrument/${encodeURIComponent(sym)}`}
                  className="lift flex items-center gap-3 py-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                >
                  <div className="w-20 shrink-0">
                    <div className="text-[14px] font-semibold text-white">{sym}</div>
                    <div className="text-[12px] text-white/40">{fmtPrice(p.price ?? p.dailyClose)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="relative h-1.5 rounded-full bg-white/[0.08]">
                      <div className="grow-x flex h-full overflow-hidden rounded-full" style={{ width: at(Math.max(0, used)), "--i": i } as React.CSSProperties}>
                        <div className={cn("h-full", used > 100 ? "bg-white/60" : "flex-1 bg-white/50")} style={used > 100 ? { width: `${(100 / used) * 100}%` } : undefined} />
                        {used > 100 && <div className="overrun h-full flex-1" />}
                      </div>
                      {scale > 100 && <span className="absolute -bottom-1 -top-1 w-px bg-white/35" style={{ left: at(100) }} aria-hidden />}
                    </div>
                  </div>
                  <div className="w-16 shrink-0 text-right">
                    <div className="font-num text-[20px] font-semibold leading-5 text-white"><AnimatedNumber value={used} from={0} format={(v) => `${Math.round(v)}%`} /></div>
                    <div className={cn("text-[12px] font-medium", ch >= 0 ? "text-up" : "text-down")}>
                      {ch >= 0 ? "▲" : "▼"} {Math.abs(ch).toFixed(2)}%
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
