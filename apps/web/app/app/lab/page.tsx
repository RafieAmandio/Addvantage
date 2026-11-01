import type { Metadata } from "next";
import Link from "next/link";
import { FOREX_PAIRS, boardRow, type BoardRow } from "@tradevantage/shared";
import { cn } from "@/lib/cn";
import { apiGet } from "@/lib/api/client-server";
import { isMockMode } from "@/lib/config/public";
import { listBars } from "@/features/chart/queries/bars";
import { toChartBars } from "@/features/chart/lib/bars";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { VERDICT, wib } from "@/features/method/lib/explain";
import { shortName } from "@/features/method/lib/overlays";
import { MiniChart } from "@/features/method/components/MiniChart";

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
const href = (r: BoardRow) => `/app/lab/${encodeURIComponent(r.symbol.replace("/", ""))}`;
// Only a break-and-retest level being touched is news; same-way levels hug price all the time.
const here = (r: BoardRow) => r.call !== "pass" && r.level?.type === "inverse" && r.level.status === "at-level";

function Card({ r }: { r: BoardRow }) {
  const l = r.level!;
  const sig = r.signals.find((s) => !s.shallow);
  return (
    <Link href={href(r)} className={cn("block rounded-2xl bg-panel p-4 ring-1 transition-colors hover:bg-raised", here(r) ? "ring-brand/70" : "ring-transparent")}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-num text-[22px] font-semibold leading-6 text-white">{r.symbol.replace("/", "")}</span>
        {here(r) ? (
          <span className="rounded-full bg-brand px-2 py-px text-[11px] font-semibold text-black">At level now</span>
        ) : (
          <span className={cn("text-[13px] font-semibold", VERDICT[r.call].cls)}>{VERDICT[r.call].label}</span>
        )}
      </div>
      <MiniChart candles={r.candles} level={l} />
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[14px] text-white">
          <span className={l.side === "buy" ? "text-up" : "text-down"}>{l.side === "buy" ? "Buy" : "Sell"}</span> {shortName(l)} <span className="font-num font-semibold">{fmtPrice(l.price)}</span>
        </span>
        {l.r !== null && <span className="font-num text-[16px] font-semibold text-white/80">{l.r.toFixed(2)}R</span>}
      </div>
      <div className="mt-1 flex items-center gap-2 text-[12px] text-white/40">
        <span className="h-1 w-12 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <span className="block h-full bg-brand" style={{ width: `${l.score}%` }} />
        </span>
        <span>Strength {l.score}</span>
        <span>·</span>
        <span className={r.bias === "bullish" ? "text-up" : r.bias === "bearish" ? "text-down" : ""}>{r.bias ? `${r.bias === "bullish" ? "Buys" : "Sells"}${sig ? `, ${sig.name.toLowerCase()}` : ""}` : "No daily bias"}</span>
      </div>
    </Link>
  );
}

export default async function LabPage() {
  const rows = await getBoard();
  const live = rows
    .filter((r) => r.call !== "pass" && r.level)
    .sort((a, b) => Number(here(b)) - Number(here(a)) || RANK[a.call] - RANK[b.call] || Number(b.level!.type === "inverse") - Number(a.level!.type === "inverse") || b.level!.score - a.level!.score);
  const passed = rows.filter((r) => !live.includes(r));
  const asOf = rows.map((r) => r.asOf).filter(Boolean).sort().at(-1);
  const stats: [string, number, string][] = [
    ["At level now", live.filter(here).length, "text-brand"],
    ["Meet every rule", live.filter((r) => r.call === "order").length, "text-white"],
    ["Need confirmation", live.filter((r) => r.call === "watch").length, "text-white"],
    ["Don't qualify", passed.length, "text-white/40"],
  ];

  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {stats.map(([k, v, cls]) => (
          <span key={k} className="flex items-baseline gap-2">
            <span className={cn("font-num text-[28px] font-semibold leading-7", cls)}>{v}</span>
            <span className="text-[13px] text-white/55">{k}</span>
          </span>
        ))}
        <span className="ml-auto text-[12px] text-white/40">{asOf ? `Daily read from the ${wib(asOf, false)} close · hourly levels refresh every hour` : "No daily candles stored yet"}</span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl bg-panel p-6 text-[14px] text-white/40">No candles stored yet. The board fills once the bars sync runs.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {live.map((r) => (
            <Card key={r.symbol} r={r} />
          ))}
        </div>
      )}

      {passed.length > 0 && (
        <details className="rounded-2xl bg-panel p-4">
          <summary className="cursor-pointer text-[14px] text-white/55 hover:text-white">{passed.length} markets with nothing that qualifies</summary>
          <div className="mt-2 divide-y divide-white/[0.07]">
            {passed.map((r) => (
              <Link key={r.symbol} href={href(r)} className="flex items-baseline gap-3 py-2.5 hover:bg-raised/60">
                <span className="w-24 shrink-0 font-num text-[16px] font-semibold text-white">{r.symbol.replace("/", "")}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-white/40">{r.why}</span>
              </Link>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
