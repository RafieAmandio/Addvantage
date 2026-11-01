import type { Metadata } from "next";
import Link from "next/link";
import { FOREX_PAIRS, boardRow, type BoardRow } from "@tradevantage/shared";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { apiGet } from "@/lib/api/client-server";
import { isMockMode } from "@/lib/config/public";
import { listBars } from "@/features/chart/queries/bars";
import { toChartBars } from "@/features/chart/lib/bars";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { VERDICT, levelName, wib } from "@/features/method/lib/explain";

export const metadata: Metadata = { title: "Chart Lab" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DAY = 86_400_000;

async function getBoard(): Promise<BoardRow[]> {
  if (!isMockMode()) return apiGet<{ rows: BoardRow[] }>("/method/board").then((d) => d.rows).catch(() => []);
  // Mock: same read as the API, on real candles pulled for preview.
  const now = Date.now();
  const rows = await Promise.all(
    FOREX_PAIRS.map(async (p) => {
      const [d, h] = await Promise.all([
        listBars({ symbol: p.symbol, interval: "1d", from: new Date(now - 200 * DAY), to: new Date(now) }),
        listBars({ symbol: p.symbol, interval: "1h", from: new Date(now - 14 * DAY), to: new Date(now) }),
      ]);
      const daily = toChartBars(d);
      return daily.length ? boardRow(p, daily, toChartBars(h)) : null;
    }),
  );
  return rows.filter((r): r is BoardRow => r !== null);
}

const RANK = { order: 0, watch: 1, pass: 2 } as const;

export default async function MethodPage() {
  const rows = (await getBoard()).sort((a, b) => RANK[a.call] - RANK[b.call] || Number(!a.bias) - Number(!b.bias));
  const count = (c: BoardRow["call"]) => rows.filter((r) => r.call === c).length;
  const biased = rows.filter((r) => r.bias).length;
  const asOf = rows.map((r) => r.asOf).filter(Boolean).sort().at(-1);

  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-white/[0.12] px-2 py-px text-white/60">{asOf ? `Daily read from the ${wib(asOf, false)} close` : "No daily candles stored yet"}</span>
        <span className="rounded-full border border-white/[0.12] px-2 py-px text-white/60">Hourly levels update every hour</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Order in", count("order"), "text-brand"],
          ["Watch for PA", count("watch"), "text-white"],
          ["Pass", count("pass"), "text-white/40"],
          ["Daily bias", biased, "text-white"],
        ].map(([k, v, cls]) => (
          <div key={k as string} className="rounded-2xl bg-panel p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{k}</p>
            <p className={cn("font-num text-[40px] font-semibold leading-[44px]", cls as string)}>{v}</p>
          </div>
        ))}
      </div>

      <Panel title="Board" sub="Every market checked against the method: daily bias first, then the nearest hourly level. Open a market to see the levels drawn and explained.">
        {rows.length === 0 ? (
          <p className="py-6 text-[14px] text-white/40">No candles stored yet. The board fills once the bars sync runs.</p>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            <div className="hidden grid-cols-[120px_150px_80px_130px_minmax(0,1fr)_70px] gap-4 pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40 md:grid">
              <span>Market</span>
              <span>Daily bias</span>
              <span className="text-right">ATR used</span>
              <span>Call</span>
              <span>Why</span>
              <span className="text-right">R</span>
            </div>
            {rows.map((r) => {
              const sig = r.signals.find((s) => !s.shallow);
              return (
                <Link
                  key={r.symbol}
                  href={`/app/lab/${encodeURIComponent(r.symbol.replace("/", ""))}`}
                  className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3 hover:bg-raised/60 md:grid-cols-[120px_150px_80px_130px_minmax(0,1fr)_70px] md:items-center"
                >
                  <span>
                    <span className="block font-num text-[18px] font-semibold text-white">{r.symbol.replace("/", "")}</span>
                    <span className="block text-[12px] text-white/40">{r.close !== null ? fmtPrice(r.close) : "n/a"}</span>
                  </span>
                  <span className={cn("text-right text-[14px] md:text-left", r.bias === "bullish" ? "text-up" : r.bias === "bearish" ? "text-down" : "text-white/40")}>
                    {r.bias === "bullish" ? "Buys" : r.bias === "bearish" ? "Sells" : "No bias"}
                    {sig && <span className="block text-[12px] text-white/40">{sig.name}{r.signals.some((s) => s.kind === "cross") ? ", cross bar" : ""}</span>}
                  </span>
                  <span className={cn("hidden text-right font-num text-[16px] font-semibold md:block", (r.usedPct ?? 0) >= 100 ? "text-down" : "text-white/80")}>
                    {r.usedPct !== null ? `${r.usedPct.toFixed(0)}%` : "n/a"}
                  </span>
                  <span className={cn("text-[14px] font-semibold", VERDICT[r.call].cls)}>{VERDICT[r.call].label}</span>
                  <span className="col-span-2 min-w-0 text-[13px] text-white/55 md:col-span-1">
                    {r.level && r.call !== "pass" ? (
                      <>
                        <span className={r.level.side === "buy" ? "text-up" : "text-down"}>{r.level.side === "buy" ? "Buy" : "Sell"}</span> {levelName(r.level)} {fmtPrice(r.level.price)}
                        {r.level.reasons[0] && <span className="text-white/40">. {r.level.reasons[0]}</span>}
                      </>
                    ) : (
                      r.why
                    )}
                  </span>
                  <span className="hidden text-right font-num text-[16px] font-semibold text-white/80 md:block">{r.level?.r != null && r.call !== "pass" ? r.level.r.toFixed(2) : ""}</span>
                </Link>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
