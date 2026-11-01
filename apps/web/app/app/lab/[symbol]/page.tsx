import type { Metadata } from "next";
import Link from "next/link";
import { FOREX_PAIRS, boardRow } from "@tradevantage/shared";
import { cn } from "@/lib/cn";
import { listBars } from "@/features/chart/queries/bars";
import { toChartBars } from "@/features/chart/lib/bars";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { MethodChart } from "@/features/method/components/MethodChart";
import { VERDICT, levelName } from "@/features/method/lib/explain";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const flat = (s: string) => s.replace("/", "").toUpperCase();
const DAY = 86_400_000;

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  return { title: `${flat(decodeURIComponent((await params).symbol))} · Chart Lab` };
}

export default async function MethodSymbolPage({ params }: { params: Promise<{ symbol: string }> }) {
  const raw = decodeURIComponent((await params).symbol);
  const pair = FOREX_PAIRS.find((p) => flat(p.symbol) === flat(raw));
  const symbol = pair?.symbol ?? raw.toUpperCase();
  const now = Date.now();
  const [h, d] = await Promise.all([
    listBars({ symbol, interval: "1h", from: new Date(now - 20 * DAY), to: new Date(now) }),
    listBars({ symbol, interval: "1d", from: new Date(now - 200 * DAY), to: new Date(now) }),
  ]);
  const hourly = toChartBars(h);
  const daily = toChartBars(d);
  const row = boardRow({ symbol, label: pair?.label ?? symbol, group: pair?.group ?? "other" }, daily, hourly);

  return (
    <div className="space-y-3 px-4 pb-10 sm:px-6">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-3">
          <h1 className="font-num text-[40px] font-semibold leading-[40px] text-white">{flat(symbol)}</h1>
          {row.close !== null && <span className="font-num text-[26px] font-semibold text-white/80">{fmtPrice(row.close)}</span>}
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
          <div>
            <dt className="text-white/40">Daily bias</dt>
            <dd className={cn("font-semibold", row.bias === "bullish" ? "text-up" : row.bias === "bearish" ? "text-down" : "text-white/55")}>
              {row.bias === "bullish" ? "Buys" : row.bias === "bearish" ? "Sells" : "None"}
              {row.signals[0] && <span className="font-normal text-white/40"> · {row.signals.map((s) => s.name).join(", ")}</span>}
            </dd>
          </div>
          <div>
            <dt className="text-white/40">ATR used</dt>
            <dd className={cn("font-semibold", (row.usedPct ?? 0) >= 100 ? "text-down" : "text-white")}>{row.usedPct !== null ? `${row.usedPct.toFixed(0)}%` : "n/a"}</dd>
          </div>
          <div>
            <dt className="text-white/40">Call</dt>
            <dd className={cn("font-semibold", VERDICT[row.call].cls)}>
              {VERDICT[row.call].label}{" "}
              <span className="font-normal text-white/40">
                · {row.level && row.call !== "pass" ? `${row.level.side === "buy" ? "Buy" : "Sell"} ${levelName(row.level)} ${fmtPrice(row.level.price)}` : row.why}
              </span>
            </dd>
          </div>
        </dl>
        <Link href="/app/lab" className="ml-auto text-[13px] text-white/55 hover:text-white">
          All markets
        </Link>
      </div>
      <MethodChart hourly={hourly} daily={daily} />
    </div>
  );
}
