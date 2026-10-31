import Link from "next/link";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { StrengthBar } from "@/features/instrument/components/DotMatrix";
import { fmtPrice, dayChange } from "@/features/dashboard/components/PriceStrip";
import type { AtrPair } from "@/features/atr/types";
import { CURRENCIES, type Bank, type Ccy, type Gauge, type MacroData } from "../types";
import { moveKind, oddsSplit, type currencyStrength } from "../lib/macro";

export const day = (iso: string) => {
  const d = new Date(iso);
  const otherYear = d.getUTCFullYear() !== new Date().getUTCFullYear();
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: otherYear ? "numeric" : undefined, timeZone: "UTC" });
};
export const signed = (n: number, d = 2) => `${n > 0 ? "+" : ""}${n.toFixed(d)}`;
/** Policy rates move in 0.125 steps somewhere; never round 3.875 to 3.88. */
export const rate = (n: number) => `${n.toFixed(Number.isInteger(Math.round(n * 1000) / 10) ? 2 : 3)}%`;
export const tone = (n: number) => (n > 0 ? "text-up" : n < 0 ? "text-down" : "text-white/55");
const usd = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Math.round(n / 1e3)}K`);

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-2 text-[17px] font-semibold tracking-[-0.01em] text-white">{children}</h2>;
}

export function Sparkline({ values, className, w = 96, h = 24 }: { values: number[]; className?: string; w?: number; h?: number }) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 4) + 2, h - 3 - ((v - lo) / (hi - lo || 1)) * (h - 6)] as const);
  const [lx, ly] = pts.at(-1)!;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className={className} aria-hidden>
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={1.5} strokeLinejoin="round" />
      <rect x={lx - 2} y={ly - 2} width={4} height={4} fill="#FFD400" />
    </svg>
  );
}

const KIND_BAR = { hike: "bg-up", hold: "bg-white/60", cut: "bg-down" } as const;

/** Compact hike / hold / cut bar, used on the instrument page. */
function OddsBar({ bank }: { bank: Bank }) {
  if (!bank.odds) return <span className="text-[12px] text-white/30">No market</span>;
  const s = oddsSplit(bank.odds);
  const lead = (["hike", "hold", "cut"] as const).reduce((a, b) => (s[b] > s[a] ? b : a));
  return (
    <a href={bank.odds.url} target="_blank" rel="noreferrer" className="group block min-w-0" title={bank.odds.title}>
      <span className="flex items-baseline justify-between gap-2 text-[12px]">
        <span className={cn("font-semibold uppercase tracking-[0.06em]", lead === "hike" ? "text-up" : lead === "cut" ? "text-down" : "text-white")}>
          {Math.round(s[lead] * 100)}% {lead}
        </span>
        <span className="text-white/40 group-hover:text-white/70">{day(bank.odds.meetingDate)} ↗</span>
      </span>
      <span className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <span className="bg-up" style={{ width: `${s.hike * 100}%` }} />
        <span className="bg-white/40" style={{ width: `${s.hold * 100}%` }} />
        <span className="bg-down" style={{ width: `${s.cut * 100}%` }} />
      </span>
    </a>
  );
}

/** One central bank: rate, last move, and every outcome of the next decision as its own bar. */
export function BankCard({ ccy, bank }: { ccy: Ccy; bank: Bank }) {
  const odds = bank.odds;
  return (
    <section className="flex flex-col rounded-2xl bg-panel p-5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[15px] font-semibold text-white">{bank.bank}</span>
        <span className="text-[12px] text-white/40">
          {ccy} · {day(bank.asOf)}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-num text-[36px] font-semibold leading-9 text-white">{rate(bank.rate)}</span>
        {bank.lastChange !== null && (
          <span className={cn("rounded-full px-2 py-0.5 text-[12px] font-semibold", bank.lastChange > 0 ? "bg-up/15 text-up" : "bg-down/15 text-down")}>
            {bank.lastChange > 0 ? "▲" : "▼"} {Math.abs(bank.lastChange * 100).toFixed(0)}bp
          </span>
        )}
      </div>
      <p className="mt-1 text-[12px] text-white/40">{bank.lastChangeDate ? `Last move ${day(bank.lastChangeDate)}` : "No move in 3 years"}</p>

      <div className="mt-4 border-t border-white/[0.07] pt-3">
        {!odds ? (
          <p className="text-[13px] text-white/30">No open market for the next decision.</p>
        ) : (
          <>
            <p className="text-[12px] text-white/55">Market odds, meeting by {day(odds.meetingDate)}</p>
            <ul className="mt-2 space-y-2">
              {odds.outcomes.slice(0, 3).map((o) => (
                <li key={o.label}>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-white/75">{o.label}</span>
                    <span className="font-semibold text-white">{Math.round(o.p * 100)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                    <div className={cn("h-full rounded-full", KIND_BAR[moveKind(o.label)])} style={{ width: `${Math.max(1, o.p * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <a href={odds.url} target="_blank" rel="noreferrer" className="mt-3 block text-[12px] text-white/40 hover:text-white/70">
              Polymarket · {usd(odds.volume)} volume ↗
            </a>
          </>
        )}
      </div>
    </section>
  );
}

export function StrengthCard({ strength }: { strength: ReturnType<typeof currencyStrength> }) {
  const max = Math.max(0.01, ...strength.map((s) => Math.abs(s.score)));
  const [top, bottom] = [strength[0], strength.at(-1)];
  return (
    <Panel title="Currency strength" sub="Average move today against the other majors">
      {strength.length === 0 ? (
        <p className="py-4 text-[14px] text-white/40">No prices yet.</p>
      ) : (
        <>
          {top && bottom && (
            <div className="mb-4 flex items-baseline gap-2">
              <span className="font-num text-[36px] font-semibold leading-9 text-white">
                {top.ccy}
                <span className="text-white/30">/</span>
                {bottom.ccy}
              </span>
              <span className="text-[13px] text-white/55">strongest vs weakest today</span>
            </div>
          )}
          <ul className="space-y-2.5">
            {strength.map((s) => (
              <li key={s.ccy} className="grid grid-cols-[40px_1fr_60px] items-center gap-3">
                <span className="text-[14px] font-semibold text-white">{s.ccy}</span>
                <StrengthBar value={s.score} max={max} />
                <span className={cn("text-right font-num text-[18px] font-semibold", tone(s.score))}>{signed(s.score)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

// ponytail: fixed thresholds (VIX 15/22, HY 3.2/4.5); percentile vs the last year if they misread regimes.
function mood(risk: MacroData["risk"]) {
  const vix = risk.vix?.v;
  const hy = risk.hy?.v;
  if (vix === undefined && hy === undefined) return null;
  if ((vix ?? 0) > 22 || (hy ?? 0) > 4.5) return { label: "Risk off", note: "Stress is up: JPY, CHF and gold tend to bid.", cls: "text-down" };
  if ((vix ?? 99) < 15 && (hy ?? 99) < 3.2) return { label: "Risk on", note: "Calm markets: carry and high-beta FX tend to lead.", cls: "text-up" };
  return { label: "Neutral", note: "No strong risk signal either way.", cls: "text-white" };
}

function GaugeRow({ name, sub, g, fmt, change }: { name: string; sub: string; g?: Gauge; fmt: (v: number) => string; change: (c: number) => string }) {
  if (!g) return null;
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-white/40">{name}</div>
        <div className="flex items-baseline gap-2">
          <span className="font-num text-[22px] font-semibold leading-6 text-white">{fmt(g.v)}</span>
          {g.change !== null && <span className={cn("text-[12px] font-medium", tone(-g.change))}>{change(g.change)}</span>}
        </div>
        <div className="text-[11px] text-white/30">{sub}</div>
      </div>
      <Sparkline values={g.spark} />
    </li>
  );
}

export function RiskCard({ risk }: { risk: MacroData["risk"] }) {
  const m = mood(risk);
  const bp = (v: number) => `${Math.round(v * 100)}bp`;
  return (
    <Panel title="Risk appetite" sub="Volatility day on day, US credit spreads month on month">
      {m && (
        <div className="mb-1">
          <div className={cn("font-num text-[36px] font-semibold leading-9", m.cls)}>{m.label}</div>
          <p className="text-[13px] text-white/55">{m.note}</p>
        </div>
      )}
      <ul className="divide-y divide-white/[0.07]">
        <GaugeRow name="VIX" sub="Yahoo ^VIX" g={risk.vix} fmt={(v) => v.toFixed(2)} change={(c) => `${signed(c)}% d/d`} />
        <GaugeRow name="MOVE (bond vol)" sub="Yahoo ^MOVE" g={risk.move} fmt={(v) => v.toFixed(2)} change={(c) => `${signed(c)}% d/d`} />
        <GaugeRow name="US IG spread (OAS)" sub="ICE BofA via FRED" g={risk.ig} fmt={bp} change={(c) => `${signed(Math.round(c * 100), 0)}bp 1m`} />
        <GaugeRow name="US HY spread (OAS)" sub="ICE BofA via FRED" g={risk.hy} fmt={bp} change={(c) => `${signed(Math.round(c * 100), 0)}bp 1m`} />
      </ul>
    </Panel>
  );
}

/** Commodity and index tiles from the ATR scanner: price, day change, share of the daily range used. */
export function MarketTiles({ pairs, sparks }: { pairs: AtrPair[]; sparks: Record<string, number[]> }) {
  const tiles = pairs.filter((p) => p.group === "commodity" || p.group === "index");
  if (tiles.length === 0) return <p className="text-[14px] text-white/40">No commodity or index prices yet.</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tiles.map((p) => {
        const ch = dayChange(p);
        const sym = p.symbol.replace("/", "");
        return (
          <Link key={p.symbol} href={`/app/instrument/${sym}`} className="flex items-center gap-3 rounded-2xl bg-panel p-4 transition-colors hover:bg-raised">
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-white">{sym}</div>
              <div className="text-[12px] text-white/40">
                {p.group} · {Math.round(p.exhaustionPct)}% of ATR used
              </div>
            </div>
            <Sparkline values={sparks[p.symbol] ?? []} w={80} h={28} />
            <div className="text-right">
              <div className="font-num text-[22px] font-semibold leading-6 text-white">{fmtPrice(p.price ?? p.dailyClose)}</div>
              <span className={cn("inline-block rounded-full px-2 py-0.5 text-[12px] font-semibold", ch >= 0 ? "bg-up/15 text-up" : "bg-down/15 text-down")}>
                {ch >= 0 ? "▲" : "▼"} {Math.abs(ch).toFixed(2)}%
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Today's % move of the row currency against the column currency. Each currency's move vs USD
 * comes from its USD pair; crosses are derived from those two legs.
 */
export function FxMatrix({ pairs }: { pairs: AtrPair[] }) {
  const vsUsd = new Map<Ccy, number>([["USD", 0]]);
  for (const p of pairs) {
    const [a, b] = p.symbol.split("/");
    if (!p.dailyOpen || !a || !b) continue;
    const ch = dayChange(p);
    if (b === "USD" && (CURRENCIES as readonly string[]).includes(a)) vsUsd.set(a as Ccy, ch);
    if (a === "USD" && (CURRENCIES as readonly string[]).includes(b)) vsUsd.set(b as Ccy, -ch);
  }
  const ccys = CURRENCIES.filter((c) => vsUsd.has(c));
  const cells = ccys.flatMap((r) => ccys.map((c) => (r === c ? 0 : vsUsd.get(r)! - vsUsd.get(c)!)));
  const max = Math.max(0.05, ...cells.map(Math.abs));
  return (
    <Panel
      title="FX matrix"
      sub="Today's % move, row currency against column currency"
      action={
        <span className="flex gap-1.5 text-[11px] font-semibold">
          <span className="rounded-full bg-up/15 px-2 py-0.5 text-up">Row stronger</span>
          <span className="rounded-full bg-down/15 px-2 py-0.5 text-down">Row weaker</span>
        </span>
      }
    >
      {ccys.length < 2 ? (
        <p className="py-4 text-[14px] text-white/40">No prices yet.</p>
      ) : (
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[640px] border-separate border-spacing-1 text-center">
            <thead>
              <tr className="text-[12px] font-semibold text-white/40">
                <th className="w-14 text-left font-semibold">Base</th>
                {ccys.map((c) => (
                  <th key={c} className="font-semibold">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ccys.map((r) => (
                <tr key={r}>
                  <th className="text-left text-[13px] font-semibold text-white">{r}</th>
                  {ccys.map((c) => {
                    if (r === c) return <td key={c} className="rounded-lg bg-white/[0.03] py-2 text-[13px] text-white/20">·</td>;
                    const v = vsUsd.get(r)! - vsUsd.get(c)!;
                    const a = 0.08 + (Math.abs(v) / max) * 0.4;
                    return (
                      <td
                        key={c}
                        className={cn("rounded-lg py-2 font-num text-[15px] font-semibold", v > 0 ? "text-up" : v < 0 ? "text-down" : "text-white/40")}
                        style={{ background: v > 0 ? `rgba(0,221,148,${a})` : v < 0 ? `rgba(255,69,77,${a})` : "rgba(255,255,255,.03)" }}
                      >
                        {signed(v)}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/** Instrument-page view: the central bank behind each leg, the policy gap, and each next decision. */
export function PairRatesPanel({ data, legs }: { data: MacroData; legs: Ccy[] }) {
  const rows = legs.filter((c) => data.banks[c]);
  if (rows.length === 0) return null;
  const [a, b] = rows;
  const gap = a && b ? data.banks[a]!.rate - data.banks[b]!.rate : null;
  return (
    <Panel
      title="Rates"
      sub={gap === null ? "The central bank behind this market" : `Policy gap ${signed(gap)} pt, carry favours ${gap > 0 ? a : gap < 0 ? b : "neither"}`}
      action={
        <Link href="/app/macro" className="rounded-full px-2.5 py-1 text-[13px] font-medium text-white/55 hover:bg-raised hover:text-white">
          Macro
        </Link>
      }
    >
      <ul className="-my-1 divide-y divide-white/[0.07]">
        {rows.map((c) => {
          const bank = data.banks[c]!;
          return (
            <li key={c} className="py-3">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[14px] font-semibold text-white">
                  {c} <span className="font-normal text-white/40">{bank.bank}</span>
                </span>
                <span className="font-num text-[22px] font-semibold leading-6 text-white">{rate(bank.rate)}</span>
              </div>
              <OddsBar bank={bank} />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
