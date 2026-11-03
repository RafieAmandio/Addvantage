"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { TextTabs } from "@/components/ui/TextTabs";
import type { CalendarEvent } from "@/features/calendar/types";
import { CURRENCIES, type Ccy, type MacroData } from "../types";

// Line colours only identify a series; green/red stay reserved for direction.
const LINE: Record<Ccy, string> = {
  USD: "#FFD400", EUR: "#7AA7FF", GBP: "#C084FC", JPY: "#F472B6",
  AUD: "#2DD4BF", NZD: "#F59E0B", CAD: "#94A3B8", CHF: "#FFFFFF",
};
const signed = (n: number, d = 2) => `${n > 0 ? "+" : ""}${n.toFixed(d)}`;
const tone = (n: number) => (n > 0 ? "text-up" : n < 0 ? "text-down" : "text-white/55");

const GAP_PAIRS: [Ccy, Ccy][] = [
  ["EUR", "USD"], ["GBP", "USD"], ["USD", "JPY"], ["AUD", "USD"], ["NZD", "USD"],
  ["USD", "CAD"], ["USD", "CHF"], ["GBP", "JPY"], ["EUR", "JPY"], ["AUD", "JPY"],
];

/** 10Y yields for 13 months (toggle currencies in the legend), then policy and 10Y gaps per pair. */
export function YieldsCard({ data }: { data: MacroData }) {
  const y = data.yields10y;
  const [on, setOn] = useState<Set<Ccy>>(() => new Set(["USD", "EUR", "GBP", "JPY", "AUD"]));
  const wrap = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(360);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e!.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 180;
  const PAD = { t: 8, r: 34, b: 20, l: 2 };
  const shown = CURRENCIES.filter((c) => on.has(c) && y?.series[c]);
  const vals = shown.flatMap((c) => (y?.series[c] ?? []).filter((v): v is number => v !== null));
  const lo = Math.floor(Math.min(...vals, 99) * 2) / 2;
  const hi = Math.ceil(Math.max(...vals, -99) * 2) / 2;
  const n = y?.months.length ?? 0;
  const x = (i: number) => PAD.l + (i / Math.max(1, n - 1)) * (W - PAD.l - PAD.r);
  const yy = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD.t - PAD.b);
  const ticks = vals.length ? [lo, (lo + hi) / 2, hi] : [];
  const gap = (a: Ccy, b: Ccy) => {
    const last = (c: Ccy) => [...(y?.series[c] ?? [])].reverse().find((v): v is number => v !== null) ?? null;
    const ya = last(a);
    const yb = last(b);
    return ya !== null && yb !== null ? ya - yb : null;
  };

  return (
    <Panel title="Global 10Y yields" sub={y ? `Monthly averages to ${y.months.at(-1)}, FRED / OECD` : "FRED / OECD"}>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {CURRENCIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={on.has(c)}
            onClick={() => setOn((s) => {
              const next = new Set(s);
              if (next.has(c)) next.delete(c);
              else next.add(c);
              return next;
            })}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
              on.has(c) ? "border-white/[0.14] text-white" : "border-transparent text-white/30 hover:text-white/60",
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: on.has(c) ? LINE[c] : "rgba(255,255,255,.2)" }} aria-hidden />
            {c}
          </button>
        ))}
      </div>
      <div ref={wrap} className="w-full">
        {y && shown.length > 0 ? (
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={shown.map((c) => `${c} ${y.series[c]?.at(-1) ?? ""}`).join(", ")}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={W - PAD.r + 4} y1={yy(t)} y2={yy(t)} stroke="rgba(255,255,255,.12)" strokeDasharray="1 4" />
                <text x={W - 2} y={yy(t) + 4} textAnchor="end" fill="rgba(255,255,255,.3)" fontSize={11}>{t.toFixed(1)}%</text>
              </g>
            ))}
            {[0, n - 1].map((i) => (
              <text key={i} x={x(i)} y={H - 4} textAnchor={i ? "end" : "start"} fill="rgba(255,255,255,.4)" fontSize={11}>{y.months[i]}</text>
            ))}
            {shown.map((c) => {
              const pts = (y.series[c] ?? []).map((v, i) => (v === null ? null : `${x(i).toFixed(1)},${yy(v).toFixed(1)}`)).filter(Boolean);
              return <polyline key={c} points={pts.join(" ")} fill="none" stroke={LINE[c]} strokeWidth={c === "USD" ? 2 : 1.5} strokeLinejoin="round" />;
            })}
          </svg>
        ) : (
          <p className="py-10 text-center text-[13px] text-white/30">{y ? "Pick a currency" : "No yield data yet."}</p>
        )}
      </div>

      <h3 className="mt-5 text-[14px] font-semibold text-white">Rate gaps</h3>
      <p className="text-[12px] text-white/40">Base minus quote. Positive: carry favours holding the base.</p>
      <div className="mt-2 divide-y divide-white/[0.07]">
        <div className="grid grid-cols-[1fr_64px_64px] gap-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">
          <span>Pair</span>
          <span className="text-right">Policy</span>
          <span className="text-right">10Y</span>
        </div>
        {GAP_PAIRS.filter(([a, b]) => data.banks[a] && data.banks[b]).map(([a, b]) => {
          const pg = data.banks[a]!.rate - data.banks[b]!.rate;
          const yg = gap(a, b);
          return (
            <Link key={a + b} href={`/app/instrument/${a}${b}`} className="grid grid-cols-[1fr_64px_64px] items-center gap-2 py-1.5 hover:text-brand">
              <span className="text-[13px] font-semibold">{a + b}</span>
              <span className={cn("text-right font-num text-[16px] font-semibold", tone(pg))}>{signed(pg)}</span>
              <span className={cn("text-right font-num text-[16px] font-semibold", yg === null ? "text-white/30" : tone(yg))}>{yg === null ? "n/a" : signed(yg)}</span>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

const REGION_CCY: Record<CalendarEvent["region"], string> = { US: "USD", EU: "EUR", UK: "GBP", JP: "JPY", CN: "CNY", ID: "IDR", GLOBAL: "ALL" };
const IMPACT_N = { low: 1, medium: 2, high: 3 } as const;
const wib = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString("en-GB", { ...o, timeZone: "Asia/Jakarta" });

function split(e: CalendarEvent) {
  const [head, ...rest] = e.title.split(" — ");
  const ccy = rest.length && /^[A-Z]{3}$/.test(head!.trim()) ? head!.trim() : REGION_CCY[e.region];
  return { ccy, name: rest.length ? rest.join(" — ") : e.title };
}

function ImpactDots({ impact }: { impact: CalendarEvent["impact"] }) {
  const n = IMPACT_N[impact];
  return (
    <span className="inline-flex gap-1" aria-label={`${impact} impact`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={cn("h-1.5 w-1.5", i <= n ? (n === 3 ? "bg-brand" : "bg-white/70") : "bg-white/[0.12]")} />
      ))}
    </span>
  );
}

/** Full-width economic calendar: currency and impact filters, grouped by WIB day. */
export function MacroCalendar({ events }: { events: CalendarEvent[] }) {
  const [ccy, setCcy] = useState("All");
  const [min, setMin] = useState<"3" | "2" | "1">("2");
  const rows = useMemo(() => events.map((e) => ({ e, ...split(e) })).sort((a, b) => a.e.ts.localeCompare(b.e.ts)), [events]);
  const ccys = ["All", ...new Set(rows.map((r) => r.ccy))];
  const shown = rows.filter((r) => (ccy === "All" || r.ccy === ccy) && IMPACT_N[r.e.impact] >= Number(min));
  const days = [...new Set(shown.map((r) => wib(r.e.ts, { weekday: "short", day: "numeric", month: "short" })))];

  return (
    <Panel
      title="Economic calendar"
      sub="This week and next, times in WIB"
      action={
        <TextTabs
          options={[{ id: "3", label: "High" }, { id: "2", label: "Medium+" }, { id: "1", label: "All impact" }] as const}
          value={min}
          onChange={setMin}
          label="Minimum impact"
        />
      }
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {ccys.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={ccy === c}
            onClick={() => setCcy(c)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
              ccy === c ? "bg-brand text-black" : "border border-white/[0.12] text-white/60 hover:text-white",
            )}
          >
            {c}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="py-8 text-center text-[14px] text-white/40">Nothing scheduled for this filter.</p>
      ) : (
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">
                <th className="w-16 pb-2 font-semibold">Time</th>
                <th className="w-16 pb-2 font-semibold">Ccy</th>
                <th className="pb-2 font-semibold">Event</th>
                <th className="w-24 pb-2 text-right font-semibold">Forecast</th>
                <th className="w-24 pb-2 text-right font-semibold">Prior</th>
                <th className="w-16 pb-2 text-right font-semibold">Impact</th>
              </tr>
            </thead>
            {days.map((d) => (
              <tbody key={d}>
                <tr>
                  <td colSpan={6} className="pb-1 pt-4">
                    <span className="rounded-full bg-raised px-2.5 py-0.5 text-[12px] font-semibold text-white/70">{d}</span>
                  </td>
                </tr>
                {shown
                  .filter((r) => wib(r.e.ts, { weekday: "short", day: "numeric", month: "short" }) === d)
                  .map(({ e, ccy: c, name }) => {
                    const fig = e.actual ?? e.forecast ?? e.consensus;
                    return (
                      <tr key={e.id} className={cn("border-t border-white/[0.07]", new Date(e.ts).getTime() < Date.now() && "opacity-50")}>
                        <td className="py-2 text-[13px] text-white/55">{wib(e.ts, { hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="py-2 text-[13px] font-semibold text-white/75">{c}</td>
                        <td className="py-2 text-[14px] text-white">{name}</td>
                        <td className="py-2 text-right font-num text-[16px] font-semibold text-white">
                          {fig ?? <span className="text-white/25">·</span>}
                          {e.actual && <span className="ml-1 text-[11px] font-normal text-white/40">act</span>}
                        </td>
                        <td className="py-2 text-right font-num text-[16px] text-white/45">{e.previous ?? "·"}</td>
                        <td className="py-2 text-right">
                          <ImpactDots impact={e.impact} />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </Panel>
  );
}
