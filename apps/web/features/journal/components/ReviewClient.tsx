"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel, PanelLink } from "@/components/ui/Panel";
import { TextTabs } from "@/components/ui/TextTabs";
import { cn } from "@/lib/cn";
import { isMockMode } from "@/lib/config/public";
import { listTrades } from "../queries";
import {
  SETUPS, SETUP_LABEL, SETUP_BREAKER, TOTAL_BREAKER, breakers, closedTrades, demonDays, demonTally, groupStats, maeFinding, stats, tradeExcursion, tradeR, wibHour, wibWeekStart, wibWeekday,
  type Excursion, type Setup, type Stats, type Trade,
} from "../lib/journal";
import { Num, eyebrow, fmtR, loadBars, rCls } from "./ui";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
type Row = Stats & { key: string | number };

function StatsTable({ rows, name, label }: { rows: Row[]; name: string; label: (k: Row["key"]) => string }) {
  if (!rows.length) return <p className="text-[14px] text-white/40">No closed trades yet.</p>;
  const ranked = rows.length > 1 ? [...rows].sort((a, b) => b.expectancy - a.expectancy) : [];
  const best = ranked[0]?.key;
  const worst = ranked.at(-1)?.key;
  const tone = (k: Row["key"]) => (k === best ? "text-up" : k === worst ? "text-down" : "text-white");
  const th = "pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";
  const td = "py-2.5 text-right font-num text-[16px] font-semibold";
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className={cn(th, "text-left")}>{name}</th>
          <th className={cn(th, "text-right")}>Trades</th>
          <th className={cn(th, "text-right")}>Strike</th>
          <th className={cn(th, "hidden text-right sm:table-cell")}>Avg win</th>
          <th className={cn(th, "hidden text-right sm:table-cell")}>Avg loss</th>
          <th className={cn(th, "text-right")}>Exp.</th>
          <th className={cn(th, "text-right")}>Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/[0.07]">
        {rows.map((r) => (
          <tr key={r.key}>
            <td className={cn("py-2.5 text-[14px]", tone(r.key))}>{label(r.key)}</td>
            <td className={cn(td, "text-white/70")}>{r.trades}</td>
            <td className={cn(td, "text-white/70")}>{r.strike.toFixed(0)}%</td>
            <td className={cn(td, "hidden text-white/70 sm:table-cell")}>{r.avgWin === null ? "·" : r.avgWin.toFixed(2)}</td>
            <td className={cn(td, "hidden text-white/70 sm:table-cell")}>{r.avgLoss === null ? "·" : r.avgLoss.toFixed(2)}</td>
            <td className={cn(td, tone(r.key))}>{r.expectancy.toFixed(2)}</td>
            <td className={cn(td, rCls(r.total))}>{fmtR(r.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Each dot is one winner, placed at how far it went toward the stop before working. */
function MaeStrip({ xs, stopPct }: { xs: Excursion[]; stopPct: number | null }) {
  const cols = new Map<number, number>();
  const dots = xs.map((x) => {
    const c = Math.min(49, Math.floor(Math.min(x.mae, 0.999) * 50));
    const y = cols.get(c) ?? 0;
    cols.set(c, y + 1);
    return { id: x.id, c, y, pct: x.mae * 100, r: x.r };
  });
  const rows = Math.max(3, ...[...cols.values()]);
  return (
    <div>
      <div className="relative" style={{ height: rows * 8 }}>
        {stopPct !== null && <span className="absolute inset-y-0 w-px bg-brand" style={{ left: `${stopPct}%` }} aria-hidden />}
        <span className="absolute inset-y-0 right-0 w-px bg-down/70" aria-hidden />
        {dots.map((d) => (
          <span
            key={d.id}
            title={`${d.pct.toFixed(0)}% to the stop, closed ${fmtR(d.r)}`}
            className="absolute h-1.5 w-1.5 bg-up"
            style={{ left: `${d.c * 2}%`, bottom: d.y * 8 }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-white/40">
        <span>Entry</span>
        <span>50% of the way</span>
        <span className="text-down">Stop</span>
      </div>
    </div>
  );
}

function Meter({ name, dd, limit }: { name: string; dd: number; limit: number }) {
  const pct = Math.min(100, (dd / limit) * 100);
  const tone = pct >= 100 ? "bg-down" : pct >= 60 ? "bg-brand" : "bg-white/50";
  return (
    <li className="py-2.5">
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className={pct >= 100 ? "text-down" : "text-white"}>
          {name}
          {pct >= 100 ? " · halted" : ""}
        </span>
        <span className="font-num text-[15px] font-semibold text-white/70">
          {dd.toFixed(2)}R <span className="text-white/30">of {limit}R</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full transition-[width] duration-200", tone)} style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

export function ReviewClient() {
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [ex, setEx] = useState<Excursion[] | null>(null);
  const [by, setBy] = useState<"weekday" | "hour" | "market">("weekday");
  const [span, setSpan] = useState<"week" | "all">(isMockMode() ? "all" : "week");

  useEffect(() => {
    listTrades().then(setTrades, () => setTrades([]));
  }, []);

  const closed = useMemo(() => closedTrades(trades ?? []), [trades]);

  // Hourly candles per market, back to that market's first trade, for MAE and MFE.
  useEffect(() => {
    if (!trades) return;
    let live = true;
    const first = new Map<string, string>();
    for (const t of closed) if (!first.has(t.symbol) || t.openedAt < first.get(t.symbol)!) first.set(t.symbol, t.openedAt);
    Promise.all([...first].map(async ([sym, from]) => [sym, (await loadBars(sym, from)).hourly] as const)).then((pairs) => {
      if (!live) return;
      const bars = new Map(pairs);
      setEx(closed.flatMap((t) => tradeExcursion(t, bars.get(t.symbol) ?? []) ?? []));
    });
    return () => {
      live = false;
    };
  }, [trades, closed]);

  if (trades === null) return <div className="px-4 pb-10 text-[14px] text-white/30 sm:px-6">Loading</div>;

  const all = stats(closed.map((t) => tradeR(t)!));
  const setupRows = groupStats(closed, (t) => t.setup, SETUPS);
  const groups: Record<typeof by, { rows: Row[]; name: string; label: (k: Row["key"]) => string }> = {
    weekday: { rows: groupStats(closed, (t) => wibWeekday(Date.parse(t.openedAt)), [0, 1, 2, 3, 4, 5, 6]), name: "Day", label: (k) => DAYS[Number(k)]! },
    hour: { rows: groupStats(closed, (t) => wibHour(Date.parse(t.openedAt)), Array.from({ length: 24 }, (_, i) => i)), name: "Hour WIB", label: (k) => `${String(k).padStart(2, "0")}:00` },
    market: { rows: groupStats(closed, (t) => t.symbol).sort((a, b) => b.trades - a.trades), name: "Market", label: (k) => String(k).replace("/", "") },
  };
  const finding = ex ? maeFinding(ex) : null;
  const winners = ex?.filter((x) => x.r > 0) ?? [];
  const after = ex?.length ? ex.reduce((s, x) => s + x.after, 0) / ex.length : null;
  const since = span === "week" ? wibWeekStart(Date.now()) : 0;
  const tally = demonTally(trades, since);
  const days = demonDays(trades, 28);
  const b = breakers(trades);
  const used = b.perSetup.filter((s) => closed.some((t) => t.setup === s.setup));

  const tiles: [string, string, string][] = [
    ["Closed trades", String(all.trades), "text-white"],
    ["Strike rate", all.trades ? `${all.strike.toFixed(0)}%` : "·", "text-white"],
    ["Expectancy", all.trades ? fmtR(all.expectancy) : "·", rCls(all.expectancy)],
    ["Total", all.trades ? fmtR(all.total) : "·", rCls(all.total)],
  ];

  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {tiles.map(([k, v, cls]) => (
          <span key={k} className="flex items-baseline gap-2">
            <Num value={v} className={cn("text-[28px] leading-7", cls)} />
            <span className="text-[13px] text-white/55">{k}</span>
          </span>
        ))}
        <span className="ml-auto">
          <PanelLink href="/app/journal">Back to the journal</PanelLink>
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <Panel title="By setup" sub="Expectancy is the average R per trade. Best in green, worst in red.">
            <StatsTable rows={setupRows} name="Setup" label={(k) => SETUP_LABEL[k as Setup]} />
          </Panel>

          <Panel title="When and where" action={<TextTabs label="Group by" options={[{ id: "weekday", label: "Weekday" }, { id: "hour", label: "Hour" }, { id: "market", label: "Market" }] as const} value={by} onChange={setBy} />}>
            <StatsTable {...groups[by]} />
          </Panel>

          <Panel title="MAE analyser" sub="How far each winner went against you before it worked, read from hourly candles">
            {ex === null ? (
              <p className="text-[14px] text-white/30">Reading hourly candles for {closed.length} trades</p>
            ) : (
              <div className="space-y-4">
                {winners.length ? <MaeStrip xs={winners} stopPct={finding?.stopPct ?? null} /> : <p className="text-[14px] text-white/40">No winners to read yet.</p>}
                {finding ? (
                  <p className="max-w-[640px] text-[15px] leading-[22px] text-white/90">{finding.text}</p>
                ) : (
                  <p className="text-[14px] text-white/40">Needs at least 3 winners and 4 closed trades to say anything.</p>
                )}
                {finding && <p className="text-[12px] text-white/40">The yellow line is that tighter stop. Each trade is replayed: stopped out if it went that far, otherwise its R grows because the risk is smaller.</p>}
                {after !== null && (
                  <div className="border-t border-white/[0.07] pt-3">
                    <p className={eyebrow}>After the exit</p>
                    <p className="mt-1 text-[15px] leading-[22px] text-white/90">
                      In the 48 hours after you closed, price ran a further <span className="font-num text-[18px] font-semibold text-white">{after.toFixed(2)}R</span> your way on average.
                      {after >= 1 ? " You left real money on the table, check the trail rules." : after < 0.3 ? " Your exits were close to the best of it." : ""}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Panel title="Demon Finder" sub="The mistakes you tagged when closing" action={<TextTabs label="Period" options={[{ id: "week", label: "This week" }, { id: "all", label: "All time" }] as const} value={span} onChange={setSpan} />}>
            {tally.length === 0 ? (
              <p className="text-[14px] text-white/40">{span === "week" ? "No mistakes tagged this week." : "No mistakes tagged yet."}</p>
            ) : (
              <ol className="divide-y divide-white/[0.07]">
                {tally.map((m, i) => (
                  <li key={m.tag} className="flex items-baseline gap-3 py-2">
                    <span className="w-4 text-[12px] text-white/30">{i + 1}</span>
                    <span className={cn("flex-1 text-[14px]", i === 0 ? "text-white" : "text-white/70")}>{m.tag}</span>
                    <span className={cn("font-num text-[17px] font-semibold", i === 0 ? "text-brand" : "text-white/70")}>{m.count}</span>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-4">
              <p className={eyebrow}>Last 28 days</p>
              <div className="mt-2 flex flex-wrap gap-[3px]" role="img" aria-label={`${days.filter((d) => d.bad).length} of the last 28 days had a tagged mistake`}>
                {days.map((d) => (
                  <span key={d.date} title={d.date} className={cn("h-1.5 w-1.5", d.bad ? "bg-[#FFD400]" : "bg-white/10")} />
                ))}
              </div>
              <p className="mt-1.5 font-mono text-[10px] text-white/30">{days.filter((d) => d.bad).length} mistake days</p>
            </div>
          </Panel>

          <Panel title="Circuit breakers" sub="Drawdown in R from each peak. A setup halts at 10R, everything at 20R.">
            <ul className="divide-y divide-white/[0.07]">
              <Meter name="All setups" dd={b.total} limit={TOTAL_BREAKER} />
              {used.map((s) => (
                <Meter key={s.setup} name={SETUP_LABEL[s.setup]} dd={s.dd} limit={SETUP_BREAKER} />
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
