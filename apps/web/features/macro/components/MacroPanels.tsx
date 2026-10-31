import Link from "next/link";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { StrengthBar } from "@/features/instrument/components/DotMatrix";
import { CURRENCIES, type Bank, type Ccy, type Gauge, type MacroData } from "../types";
import { oddsSplit, type currencyStrength } from "../lib/macro";

const day = (iso: string) => {
  const d = new Date(iso);
  const otherYear = d.getUTCFullYear() !== new Date().getUTCFullYear();
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: otherYear ? "numeric" : undefined, timeZone: "UTC" });
};
const signed = (n: number, d = 2) => `${n > 0 ? "+" : ""}${n.toFixed(d)}`;
/** Policy rates move in 0.125 steps somewhere; never round 3.875 to 3.88. */
const rate = (n: number) => `${n.toFixed(Number.isInteger(Math.round(n * 1000) / 10) ? 2 : 3)}%`;
const tone = (n: number) => (n > 0 ? "text-up" : n < 0 ? "text-down" : "text-white/55");

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const W = 96;
  const H = 24;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (W - 4) + 2, H - 3 - ((v - lo) / (hi - lo || 1)) * (H - 6)] as const);
  const [lx, ly] = pts.at(-1)!;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className={className} aria-hidden>
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={1.5} strokeLinejoin="round" />
      <rect x={lx - 2} y={ly - 2} width={4} height={4} fill="#FFD400" />
    </svg>
  );
}

/** Hike / hold / cut probabilities as one stacked bar, with the leading outcome written above it. */
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

export function CentralBanksPanel({ banks }: { banks: MacroData["banks"] }) {
  const rows = CURRENCIES.filter((c) => banks[c]);
  return (
    <Panel title="Central banks" sub="Policy rate, last move and the market's odds for the next decision">
      {rows.length === 0 ? (
        <p className="py-6 text-[14px] text-white/40">No policy data yet.</p>
      ) : (
        <div className="-my-1 divide-y divide-white/[0.07]">
          <div className="hidden grid-cols-[110px_90px_130px_minmax(0,1fr)] gap-4 pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40 sm:grid">
            <span>Bank</span>
            <span className="text-right">Rate</span>
            <span>Last move</span>
            <span>Next decision (Polymarket)</span>
          </div>
          {rows.map((c) => {
            const b = banks[c]!;
            return (
              <div key={c} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-3 sm:grid-cols-[110px_90px_130px_minmax(0,1fr)]">
                <div>
                  <div className="text-[15px] font-semibold text-white">{c}</div>
                  <div className="text-[12px] text-white/40">{b.bank}</div>
                </div>
                <div className="text-right font-num text-[26px] font-semibold leading-7 text-white">{rate(b.rate)}</div>
                <div className="text-[13px]">
                  {b.lastChange !== null && b.lastChangeDate ? (
                    <>
                      <span className={cn("font-semibold", tone(b.lastChange))}>
                        {b.lastChange > 0 ? "▲" : "▼"} {Math.abs(b.lastChange * 100).toFixed(0)} bp
                      </span>
                      <span className="ml-1.5 text-white/40">{day(b.lastChangeDate)}</span>
                    </>
                  ) : (
                    <span className="text-white/30">No move in 3y</span>
                  )}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <OddsBar bank={b} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

export function StrengthPanel({ strength }: { strength: ReturnType<typeof currencyStrength> }) {
  const max = Math.max(0.01, ...strength.map((s) => Math.abs(s.score)));
  return (
    <Panel title="Currency strength" sub="Average move today against the other majors">
      {strength.length === 0 ? (
        <p className="py-4 text-[14px] text-white/40">No prices yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {strength.map((s) => (
            <li key={s.ccy} className="grid grid-cols-[40px_1fr_60px] items-center gap-3">
              <span className="text-[14px] font-semibold text-white">{s.ccy}</span>
              <StrengthBar value={s.score} max={max} />
              <span className={cn("text-right font-num text-[18px] font-semibold", tone(s.score))}>{signed(s.score)}%</span>
            </li>
          ))}
        </ul>
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

function GaugeRow({ name, sub, g, unit = "", changeUnit = "" }: { name: string; sub: string; g?: Gauge; unit?: string; changeUnit?: string }) {
  if (!g) return null;
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-white">{name}</div>
        <div className="text-[12px] text-white/40">{sub}</div>
      </div>
      <Sparkline values={g.spark} />
      <div className="w-16 text-right">
        <div className="font-num text-[20px] font-semibold leading-5 text-white">
          {g.v.toFixed(2)}
          {unit}
        </div>
        {g.change !== null && <div className={cn("text-[12px] font-medium", tone(-g.change))}>{signed(g.change)}{changeUnit}</div>}
      </div>
    </li>
  );
}

export function RiskPanel({ risk }: { risk: MacroData["risk"] }) {
  const m = mood(risk);
  return (
    <Panel title="Risk mood" sub="Equity and bond volatility, US junk-bond spread">
      {m && (
        <div className="mb-2">
          <div className={cn("font-num text-[30px] font-semibold leading-8", m.cls)}>{m.label}</div>
          <p className="text-[13px] text-white/55">{m.note}</p>
        </div>
      )}
      <ul className="divide-y divide-white/[0.07]">
        <GaugeRow name="VIX" sub="S&P 500 volatility, day change" g={risk.vix} changeUnit="%" />
        <GaugeRow name="MOVE" sub="Treasury volatility, day change" g={risk.move} changeUnit="%" />
        <GaugeRow name="HY spread" sub="US high yield, 1 month change" g={risk.hy} unit="%" changeUnit=" pt" />
      </ul>
    </Panel>
  );
}

const GAP_PAIRS: [Ccy, Ccy][] = [
  ["EUR", "USD"], ["GBP", "USD"], ["USD", "JPY"], ["AUD", "USD"], ["NZD", "USD"],
  ["USD", "CAD"], ["USD", "CHF"], ["GBP", "JPY"], ["EUR", "JPY"], ["AUD", "JPY"],
];

/** Base minus quote for policy rate and latest 10Y: positive means carry favours holding the base. */
export function RateGapsPanel({ data }: { data: MacroData }) {
  const y = (c: Ccy) => [...(data.yields10y?.series[c] ?? [])].reverse().find((v): v is number => v !== null) ?? null;
  const rows = GAP_PAIRS.filter(([a, b]) => data.banks[a] && data.banks[b]);
  return (
    <Panel title="Rate gaps" sub="Base minus quote. Positive: carry favours holding the base">
      <div className="-my-1 divide-y divide-white/[0.07]">
        <div className="grid grid-cols-[1fr_80px_80px] gap-3 pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
          <span>Pair</span>
          <span className="text-right">Policy</span>
          <span className="text-right">10Y</span>
        </div>
        {rows.map(([a, b]) => {
          const pg = data.banks[a]!.rate - data.banks[b]!.rate;
          const ya = y(a);
          const yb = y(b);
          const yg = ya !== null && yb !== null ? ya - yb : null;
          return (
            <Link key={a + b} href={`/app/instrument/${a}${b}`} className="grid grid-cols-[1fr_80px_80px] items-center gap-3 py-2 hover:text-brand">
              <span className="text-[14px] font-semibold">{a + b}</span>
              <span className={cn("text-right font-num text-[18px] font-semibold", tone(pg))}>{signed(pg)}</span>
              <span className={cn("text-right font-num text-[18px] font-semibold", yg === null ? "text-white/30" : tone(yg))}>{yg === null ? "n/a" : signed(yg)}</span>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

export function YieldsPanel({ data }: { data: MacroData }) {
  const y = data.yields10y;
  const curve = data.usCurve;
  return (
    <Panel title="10Y yields" sub={y ? `Monthly averages to ${y.months.at(-1)}, FRED` : "FRED"}>
      {curve && (
        <div className="mb-3 flex items-baseline justify-between rounded-xl bg-raised px-3 py-2 text-[13px]">
          <span className="text-white/55">
            US 2Y {curve.y2.toFixed(2)} · 10Y {curve.y10.toFixed(2)}
          </span>
          <span className={cn("font-num text-[18px] font-semibold", tone(curve.y10 - curve.y2))}>
            {signed((curve.y10 - curve.y2) * 100, 0)} bp
          </span>
        </div>
      )}
      {!y ? (
        <p className="py-4 text-[14px] text-white/40">No yield data yet.</p>
      ) : (
        <ul className="-my-1 divide-y divide-white/[0.07]">
          {CURRENCIES.map((c) => {
            const vals = (y.series[c] ?? []).filter((v): v is number => v !== null);
            const last = vals.at(-1);
            const prev = vals.at(-2);
            if (last === undefined) return null;
            return (
              <li key={c} className="flex items-center gap-3 py-2">
                <span className="w-10 text-[14px] font-semibold text-white">{c}</span>
                <Sparkline values={vals} className="flex-1" />
                <span className="w-14 text-right font-num text-[18px] font-semibold text-white">{last.toFixed(2)}</span>
                <span className="w-14 text-right text-[12px] font-medium text-white/55">
                  {prev === undefined ? "" : `${signed((last - prev) * 100, 0)} bp`}
                </span>
              </li>
            );
          })}
        </ul>
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
