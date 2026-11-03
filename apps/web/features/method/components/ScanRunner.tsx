"use client";

import { useEffect, useMemo, useState } from "react";
import { isMockMode } from "@/lib/config/public";
import Link from "next/link";
import type { BoardRow } from "@tradevantage/shared";
import { cn } from "@/lib/cn";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { MiniChart } from "./MiniChart";
import type { Box } from "./BoxPrimitive";
import { ATR_STATES, PATTERNS, judgeAtr, judgeBreak, judgePattern, scanFacts, type AtrState, type Pattern } from "../lib/scan";
import { savePlan, type PlanPick } from "@/features/journal/queries";

type Pick = { pattern?: Pattern; broke?: boolean; atr?: AtrState; draw?: boolean; clarity?: number; note?: string };
const STEPS = ["pattern", "broke", "atr", "draw", "clarity"] as const;

const btn = (on = false) =>
  cn(
    "h-10 rounded-full px-4 text-[14px] font-medium ring-1 transition duration-150 motion-safe:active:scale-[0.96] focus-visible:outline-none focus-visible:ring-brand",
    on ? "bg-white text-black ring-white" : "text-white ring-white/[0.14] hover:bg-raised",
  );

/** The daily-close routine: about 10 seconds a market, the trader reads, the candles check, the plan is the ranked result. */
export function ScanRunner({ rows, date }: { rows: BoardRow[]; date: string }) {
  const [at, setAt] = useState(0);
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const done = at >= rows.length;
  const row = rows[Math.min(at, rows.length - 1)];
  const facts = useMemo(() => (row ? scanFacts(row) : null), [row]);
  const p = (row && picks[row.symbol]) || {};
  const step = STEPS.findIndex((k) => p[k] === undefined);
  const set = (patch: Pick) => row && setPicks((x) => ({ ...x, [row.symbol]: { ...x[row.symbol], ...patch } }));
  const next = () => setAt((i) => Math.min(rows.length, i + 1));

  // Answered-question highlights on the daily mini chart: the last candle, the swing it closed through.
  // Memoised so typing a note doesn't rebuild the chart.
  const answeredPattern = p.pattern !== undefined;
  const answeredBroke = p.broke !== undefined;
  const extra = useMemo(() => {
    const out: Box[] = [];
    if (!row || !facts) return out;
    const last = row.days.length - 1;
    if (answeredPattern) {
      const b = row.days[last]!;
      out.push({ i0: last, i1: last, top: b.high, bottom: b.low, fill: "rgba(255,212,0,.12)", stroke: "rgba(255,212,0,.8)" });
    }
    if (facts.broke && answeredBroke) {
      const w = (row.atr ?? 0) * 0.03;
      out.push({ i0: Math.max(0, last - 25), i1: last + 2, top: facts.broke.price + w, bottom: facts.broke.price - w, fill: "rgba(255,255,255,.35)", label: facts.broke.weekly ? "W" : "D" });
    }
    return out;
  }, [row, facts, answeredPattern, answeredBroke]);

  // Keyboard: 1 to 5 sets clarity, Enter or right arrow moves on, left arrow goes back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (step === 4 && /^[1-5]$/.test(e.key)) set({ clarity: Number(e.key) });
      if ((e.key === "Enter" || e.key === "ArrowRight") && step === -1) next();
      if (e.key === "ArrowLeft") setAt((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (rows.length === 0) return <p className="rounded-2xl bg-panel p-6 text-[14px] text-white/40">No daily candles stored yet. The scan works once the bars sync runs.</p>;

  const ranked = rows
    .map((r) => ({ r, p: picks[r.symbol] }))
    .filter((x) => x.p?.clarity)
    .sort((a, b) => b.p!.clarity! - a.p!.clarity!);
  const graded = rows.flatMap((r) => {
    const x = picks[r.symbol];
    if (!x) return [];
    const f = scanFacts(r);
    const out: boolean[] = [];
    if (x.pattern) out.push(judgePattern(f, x.pattern).ok);
    if (x.broke !== undefined) out.push(judgeBreak(f, x.broke).ok);
    if (x.atr) out.push(judgeAtr(f, x.atr).ok);
    return out;
  });
  const right = graded.filter(Boolean).length;

  const save = async () => {
    setSaved("saving");
    const out: PlanPick[] = ranked.map(({ r, p: x }) => ({
      symbol: r.symbol,
      clarity: x!.clarity!,
      note: x!.note ?? "",
      // Yes/no record of the scan: what the trader said, and whether each checkable read matched the candles.
      answers: {
        brokeLevel: x!.broke ?? null,
        clearDraw: x!.draw ?? null,
        patternMatched: x!.pattern ? judgePattern(scanFacts(r), x!.pattern).ok : null,
        atrMatched: x!.atr ? judgeAtr(scanFacts(r), x!.atr).ok : null,
      },
    }));
    try {
      await savePlan(date, out);
      setSaved("saved");
    } catch {
      setSaved("error");
    }
  };


  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 rounded-2xl bg-panel p-5">
        {/* Progress: one dot per market, brighter = clearer */}
        <div className="flex flex-wrap items-center gap-1" aria-label={`Market ${Math.min(at + 1, rows.length)} of ${rows.length}`}>
          {rows.map((r, i) => {
            const c = picks[r.symbol]?.clarity;
            return (
              <button
                key={r.symbol}
                type="button"
                title={r.symbol}
                onClick={() => setAt(i)}
                className={cn("h-2.5 w-2.5 transition-all duration-200", i === at && !done ? "scale-125 bg-white" : c ? "bg-brand" : "bg-white/15 hover:bg-white/40")}
                style={c ? { opacity: 0.35 + c * 0.13 } : undefined}
              />
            );
          })}
        </div>

        {done ? (
          <div className="mt-5 motion-safe:animate-[rise_250ms_ease-out]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Scan done</p>
            <p className="mt-1 font-num text-[40px] font-semibold leading-[44px] text-white">
              {right}/{graded.length} <span className="text-[16px] font-normal text-white/55">reads matched the candles</span>
            </p>
            {ranked[0] ? (
              <div className="mt-5 rounded-xl bg-raised p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">The one you can&apos;t not trade</p>
                <p className="mt-1 font-num text-[28px] font-semibold text-white">{ranked[0].r.symbol.replace("/", "")}</p>
                {ranked[0].p!.note && <p className="text-[14px] text-white/70">{ranked[0].p!.note}</p>}
                {isMockMode() && ( // Chart Lab is coming soon in production
                  <Link href={`/app/lab/${ranked[0].r.symbol.replace("/", "")}`} className="mt-3 inline-flex h-10 items-center rounded-full bg-brand px-4 text-[14px] font-semibold text-black transition motion-safe:active:scale-[0.97]">
                    Map its levels in Chart Lab
                  </Link>
                )}
              </div>
            ) : (
              <p className="mt-4 text-[14px] text-white/55">You did not rate any market. Nothing clear today is a valid answer: no trade is a position too.</p>
            )}
            <div className="mt-4 flex items-center gap-3">
              <button type="button" onClick={save} disabled={saved === "saving" || ranked.length === 0} className={cn(btn(), "disabled:opacity-40")}>
                {saved === "saved" ? <span className="motion-safe:animate-[rise_200ms_ease-out]">✓ Saved to today&apos;s plan</span> : saved === "saving" ? "Saving" : "Save as today's plan"}
              </button>
              {saved === "error" && <span className="text-[13px] text-down">Could not save. Try again.</span>}
              <button type="button" onClick={() => setAt(0)} className="text-[13px] text-white/40 hover:text-white">
                Back to the first market
              </button>
            </div>
          </div>
        ) : row && facts ? (
          <div key={row.symbol} className="motion-safe:animate-[rise_200ms_ease-out]">
            <div className="mt-4 flex items-baseline justify-between gap-3">
              <p className="font-num text-[28px] font-semibold leading-8 text-white">
                {row.symbol.replace("/", "")} <span className="text-[18px] text-white/55">{row.days.at(-1) ? fmtPrice(row.days.at(-1)!.close) : ""}</span>
              </p>
              <span className="text-[13px] text-white/40">
                {at + 1} of {rows.length}
              </span>
            </div>
            {/* A ten second nudge, not a limit: the scan is meant to be fast. */}
            <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-white/10">
              <div key={row.symbol} className="h-full origin-left bg-white/40 motion-safe:animate-[nudge_10s_linear_forwards]" />
            </div>
            <MiniChart candles={row.days} level={null} extra={extra} height={200} />

            <ol className="mt-3 space-y-4">
              <Q n={1} on={step === 0} done={p.pattern !== undefined} ask="What did the last daily candle print?">
                <div className="flex flex-wrap gap-2">
                  {PATTERNS.map((x) => (
                    <button key={x} type="button" disabled={p.pattern !== undefined} onClick={() => set({ pattern: x })} className={btn(p.pattern === x)}>
                      {x}
                    </button>
                  ))}
                </div>
                {p.pattern && <Verdict {...judgePattern(facts, p.pattern)} />}
              </Q>
              <Q n={2} on={step === 1} done={p.broke !== undefined} ask="Did the close go through a weekly or daily swing?">
                <YesNo value={p.broke} onPick={(v) => set({ broke: v })} />
                {p.broke !== undefined && <Verdict {...judgeBreak(facts, p.broke)} />}
              </Q>
              <Q n={3} on={step === 2} done={p.atr !== undefined} ask="Where is the day against its average range?">
                <div className="flex flex-wrap gap-2">
                  {ATR_STATES.map((x) => (
                    <button key={x.key} type="button" disabled={p.atr !== undefined} onClick={() => set({ atr: x.key })} className={btn(p.atr === x.key)}>
                      {x.label}
                    </button>
                  ))}
                </div>
                {p.atr && <Verdict {...judgeAtr(facts, p.atr)} />}
              </Q>
              <Q n={4} on={step === 3} done={p.draw !== undefined} ask="Is there a clear draw on price?">
                <YesNo value={p.draw} onPick={(v) => set({ draw: v })} />
                {p.draw !== undefined && <p className="mt-2 text-[13px] text-white/55 motion-safe:animate-[rise_200ms_ease-out]">{facts.draw ? `For reference: ${facts.draw}.` : "No equal highs or lows nearby. Your call."}</p>}
              </Q>
              <Q n={5} on={step === 4} done={p.clarity !== undefined} ask="How clear is this market? 1 is messy, 5 is can't-not-trade.">
                <div className="flex flex-wrap items-center gap-2">
                  {[1, 2, 3, 4, 5].map((c) => (
                    <button key={c} type="button" onClick={() => set({ clarity: c })} className={cn(btn(p.clarity === c), "w-10 px-0 font-num")}>
                      {c}
                    </button>
                  ))}
                  <input
                    value={p.note ?? ""}
                    onChange={(e) => set({ note: e.target.value })}
                    placeholder="Note (optional)"
                    className="h-10 min-w-0 flex-1 basis-full rounded-full bg-raised px-4 sm:basis-auto text-[14px] text-white outline-none ring-1 ring-white/[0.08] placeholder:text-white/25 focus-visible:ring-brand"
                  />
                </div>
              </Q>
            </ol>

            <div className="mt-5 flex items-center gap-3">
              <button type="button" onClick={() => setAt((i) => Math.max(0, i - 1))} disabled={at === 0} className={cn(btn(), "disabled:opacity-30")}>
                Back
              </button>
              <button
                type="button"
                onClick={next}
                className={cn("h-10 rounded-full px-5 text-[14px] font-semibold transition duration-150 motion-safe:active:scale-[0.96]", step === -1 ? "bg-brand text-black" : "text-white/55 ring-1 ring-white/[0.14] hover:text-white")}
              >
                {step === -1 ? (at === rows.length - 1 ? "Finish" : "Next market") : "Skip"}
              </button>
              <span className="hidden text-[12px] text-white/30 sm:inline">Keys: 1 to 5 to rate, Enter for next</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Running plan: rated markets, clearest first */}
      <aside className="rounded-2xl bg-panel p-5 lg:sticky lg:top-4 lg:self-start">
        <p className="text-[15px] font-semibold text-white">Today&apos;s plan</p>
        <p className="text-[13px] text-white/55">Clearest first. Focus on the top one or two.</p>
        <div className="mt-3 divide-y divide-white/[0.07]">
          {ranked.length === 0 && <p className="py-3 text-[14px] text-white/40">Rate a market to start the list.</p>}
          {ranked.map(({ r, p: x }, i) => (
            <div key={r.symbol} className="flex items-center gap-3 py-2.5 motion-safe:animate-[rise_200ms_ease-out]">
              <span className={cn("font-num text-[18px] font-semibold", i === 0 ? "text-brand" : "text-white")}>{r.symbol.replace("/", "")}</span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-white/40">{x!.note || [x!.pattern, x!.broke ? "broke a level" : null].filter(Boolean).join(", ")}</span>
              <span className="flex gap-0.5" aria-label={`Clarity ${x!.clarity} of 5`}>
                {[1, 2, 3, 4, 5].map((c) => (
                  <span key={c} className={cn("h-2 w-2", c <= x!.clarity! ? "bg-brand" : "bg-white/10")} />
                ))}
              </span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function Q({ n, on, done, ask, children }: { n: number; on: boolean; done: boolean; ask: string; children: React.ReactNode }) {
  return (
    <li className={cn("grid grid-cols-[22px_1fr] gap-2 transition-opacity duration-200", !on && !done && "opacity-35")}>
      <span className={cn("font-num text-[16px] font-semibold", done ? "text-up" : on ? "text-brand" : "text-white/40")}>{done ? "✓" : n}</span>
      <div className="min-w-0">
        <p className="mb-2 text-[15px] font-medium text-white">{ask}</p>
        {children}
      </div>
    </li>
  );
}

function YesNo({ value, onPick }: { value: boolean | undefined; onPick: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {([["Yes", true], ["No", false]] as const).map(([l, v]) => (
        <button key={l} type="button" disabled={value !== undefined} onClick={() => onPick(v)} className={btn(value === v)}>
          {l}
        </button>
      ))}
    </div>
  );
}

function Verdict({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className={cn("mt-2 text-[13px] leading-5 motion-safe:animate-[rise_200ms_ease-out]", ok ? "text-up" : "text-white/75")}>
      <span className={cn("mr-1 font-semibold", ok ? "text-up" : "text-down")}>{ok ? "Matches." : "The candles say otherwise."}</span>
      {text}
    </p>
  );
}
