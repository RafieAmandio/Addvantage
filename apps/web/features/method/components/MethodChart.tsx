"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  LineStyle,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { marketMap, readDaily, readLevels, weekendGap, type Candle, type Level, type Signal } from "@tradevantage/shared";
import { cn } from "@/lib/cn";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { BoxPrimitive } from "./BoxPrimitive";
import { DEFAULT_LAYERS, LAYERS, LAYER_GROUPS, buildOverlays, indexer, practiceOverlays, type Layer, type Pick } from "../lib/overlays";
import { explainSignal, levelName, wib } from "../lib/explain";
import { checklist, type Rule } from "../lib/checklist";
import { strongest, suggest } from "../lib/suggest";
import { Checklist, RuleCount, SuggestionCard } from "./SuggestionCard";
import { Popover } from "./Popover";
import { QUESTIONS, buildDrills, gradeLevel, gradeNaked, gradeQualifies, gradeStop, gradeThrust, type Answer, type Drill } from "../lib/practice";

const sec = (iso: string) => Math.floor(Date.parse(iso) / 1000) as UTCTimestamp;
const STYLE = {
  solid: LineStyle.Solid,
  dashed: LineStyle.Dashed,
  dotted: LineStyle.Dotted,
} as const;

type Mode = "study" | "practice";

/**
 * The Chart Lab workspace: a toolbar, the chart filling the space, and a docked side panel
 * (suggestion or practice) that collapses; on phones the panel is a bottom sheet.
 * Layers, mode and the panel state belong to the parent so they survive a market switch.
 */
export function MethodChart({
  hourly,
  daily,
  pip = null,
  picker,
  layers,
  onLayers: setLayers,
  mode,
  onMode: setMode,
  panel,
  onPanel,
  loading = false,
}: {
  hourly: Candle[];
  daily: Candle[];
  /** Pip size for FX, for the weekend gap threshold. */
  pip?: number | null;
  /** Symbol picker, first in the toolbar. */
  picker: React.ReactNode;
  layers: Set<Layer>;
  onLayers: (s: Set<Layer>) => void;
  mode: Mode;
  onMode: (m: Mode) => void;
  panel: boolean;
  onPanel: (open: boolean) => void;
  loading?: boolean;
}) {
  const read = useMemo(() => readDaily(daily), [daily]);
  // Levels read on the last 20 days, same window as the board, even though the chart keeps 60 for replay.
  const levels = useMemo(() => readLevels(hourly.slice(-480), read, 3), [hourly, read]);
  const [tf, setTf] = useState<"1H" | "1D">("1H");
  const [pick, setPick] = useState<Pick>(null);
  const map = useMemo(() => marketMap(daily), [daily]);
  const gap = useMemo(() => weekendGap(hourly, read.atr, pip), [hourly, read.atr, pip]);
  const [sheet, setSheet] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [drillAt, setDrillAt] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState({ right: 0, asked: 0 });

  // Replay: past moments where a fresh break-and-retest level was readable, most recent finished one first, today's last.
  const drills = useMemo(() => {
    if (mode !== "practice") return [];
    const all = buildDrills(hourly, daily);
    const live = all.filter((x) => x.cut === hourly.length);
    return [...all.filter((x) => x.cut !== hourly.length).reverse(), ...live];
  }, [mode, hourly, daily]);
  const drill = drills[drillAt] ?? null;
  const practicing = mode === "practice" && drill !== null && tf === "1H";
  // Memoised: a new array identity would rebuild the chart on every render.
  const bars = useMemo(() => (practicing ? hourly.slice(drill!.from, revealed ? Math.min(hourly.length, drill!.cut + 96) : drill!.cut) : tf === "1H" ? hourly : daily), [practicing, drill, revealed, tf, hourly, daily]);
  const q = QUESTIONS[answers.length];
  const drillRules = useMemo(() => (drill ? checklist(drill.level, drill.daily) : []), [drill]);

  const answer = (a: { time?: string; price?: number; choice?: boolean }) => {
    if (!drill || !q) return;
    const l = drill.level;
    const window = hourly.slice(drill.from, drill.cut);
    const graded =
      q.key === "thrust" && a.time
        ? gradeThrust(l, window, a.time)
        : q.key === "level" && a.price !== undefined
          ? gradeLevel(l, window, a.price, drill.daily)
          : q.key === "stop" && a.price !== undefined
            ? gradeStop(l, a.price, drill.daily)
            : q.key === "naked" && a.choice !== undefined
              ? gradeNaked(l, a.choice)
              : q.key === "qualifies" && a.choice !== undefined
                ? gradeQualifies(
                    l,
                    a.choice,
                    drillRules.filter((r) => !r.met).map((r) => r.rule),
                  )
                : null;
    if (!graded) return;
    setAnswers((xs) => [...xs, graded]);
    setTally((t) => ({
      right: t.right + Number(graded.ok),
      asked: t.asked + 1,
    }));
  };
  const goDrill = (i: number) => {
    setDrillAt(i);
    setAnswers([]);
    setRevealed(false);
  };
  const startPractice = () => {
    setMode("practice");
    setTf("1H");
    setPick(null);
    goDrill(0);
  };

  const overlays = useMemo(
    () =>
      practicing
        ? practiceOverlays({
            bars,
            daily: drill!.daily,
            level: drill!.level,
            answers,
            outcome: revealed ? drill!.outcome : undefined,
          })
        : buildOverlays({
            tf,
            bars,
            daily: read,
            levels,
            layers,
            pick,
            map,
            gap,
          }),
    [practicing, drill, answers, revealed, tf, bars, read, levels, layers, pick, map, gap],
  );
  // The card reads the picked level, or the strongest one before anything is picked.
  const focus = pick?.kind === "level" ? pick.level : pick ? null : strongest(levels);
  const focusRules = useMemo(() => (focus ? checklist(focus, read) : []), [focus, read]);
  const signalText = pick?.kind === "signal" ? explainSignal(pick.signal) : null;

  const select = (p: Pick) => {
    setPick(p);
    setSheet(false); // on phones, show the chart with the pick drawn
    if (p?.kind === "level") setTf("1H");
    if (p?.kind === "signal") setTf("1D");
  };

  const el = useRef<HTMLDivElement>(null);
  const api = useRef<{
    chart: IChartApi;
    series: ISeriesApi<"Candlestick">;
    boxes: BoxPrimitive;
    markers: ISeriesMarkersPluginApi<Time>;
    lines: IPriceLine[];
  } | null>(null);
  // Latest click targets for the chart's click handler, which is bound once per chart.
  const targets = useRef({
    levels,
    signals: read.signals,
    tf,
    select,
    practicing,
    tap: q?.tap,
    answer,
  });
  targets.current = {
    levels,
    signals: read.signals,
    tf,
    select,
    practicing,
    tap: q?.tap,
    answer,
  };

  useEffect(() => {
    const node = el.current;
    if (!node || bars.length === 0) return;
    const ref = bars.at(-1)!.close;
    const pad = tf === "1H" ? 26 : 8;
    const prec = ref >= 1000 ? 2 : ref >= 10 ? 3 : 5;
    const chart = createChart(node, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#121212" },
        textColor: "rgba(255,255,255,.55)",
        fontFamily: "Geist, sans-serif",
        fontSize: 12,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: {
          color: "rgba(255,255,255,.1)",
          style: LineStyle.SparseDotted,
        },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: pad,
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: "rgba(255,255,255,.3)",
          labelBackgroundColor: "#1A1A1A",
        },
        horzLine: {
          color: "rgba(255,255,255,.3)",
          labelBackgroundColor: "#1A1A1A",
        },
      },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#00DD94",
      downColor: "#FF454D",
      borderVisible: false,
      wickUpColor: "#00DD94",
      wickDownColor: "#FF454D",
      priceLineColor: "rgba(255,255,255,.5)",
      priceFormat: { type: "price", precision: prec, minMove: 10 ** -prec },
    });
    series.setData(
      bars.map((b) => ({
        time: sec(b.time),
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      })),
    );
    const boxes = new BoxPrimitive([]);
    series.attachPrimitive(boxes);
    const markers = createSeriesMarkers(series, []);
    api.current = { chart, series, boxes, markers, lines: [] };

    // Tap near a level line selects it; on the daily chart, tapping a signal candle selects the signal.
    chart.subscribeClick((p) => {
      const t = targets.current;
      if (!p.point) return;
      if (t.practicing) {
        // In practice a tap is an answer: the candle under the finger, or the price at that height.
        if (t.tap === "candle" && p.time !== undefined) {
          const b = bars.find((x) => sec(x.time) === p.time);
          if (b) t.answer({ time: b.time });
        }
        if (t.tap === "price") {
          const price = series.coordinateToPrice(p.point.y);
          if (price !== null) t.answer({ price });
        }
        return;
      }
      const near = t.levels
        .map((l) => ({
          l,
          y: series.priceToCoordinate(l.price) as number | null,
        }))
        .filter((x): x is { l: Level; y: number } => x.y !== null && Math.abs(x.y - p.point!.y) <= 10)
        .sort((a, b) => Math.abs(a.y - p.point!.y) - Math.abs(b.y - p.point!.y))[0];
      if (near) return t.select({ kind: "level", level: near.l });
      if (t.tf === "1D" && p.time !== undefined) {
        const s = t.signals.find((x) => sec(x.time) === p.time);
        if (s) return t.select({ kind: "signal", signal: s });
      }
    });
    return () => {
      chart.remove();
      api.current = null;
    };
    // tf only changes together with bars; listed so the margin follows the timeframe.
  }, [bars, tf]);

  useEffect(() => {
    const a = api.current;
    if (!a) return;
    a.boxes.set(
      overlays.boxes,
      bars.map((b) => sec(b.time)),
    );
    for (const l of a.lines) a.series.removePriceLine(l);
    a.lines = overlays.lines.map((l) =>
      a.series.createPriceLine({
        price: l.price,
        color: l.color,
        lineStyle: STYLE[l.style],
        lineWidth: l.width ?? 1,
        title: l.label,
        axisLabelVisible: true,
      }),
    );
    const at = indexer(bars);
    a.markers.setMarkers(
      overlays.marks
        .map((m) => ({ i: at(m.time), m }))
        .filter((x) => x.i >= 0)
        .map(({ i, m }) => ({
          time: sec(bars[i]!.time),
          position: m.above ? ("aboveBar" as const) : ("belowBar" as const),
          shape: m.above ? ("arrowDown" as const) : ("arrowUp" as const),
          color: m.color,
          text: m.text,
          size: 1,
        }))
        .sort((x, y) => x.time - y.time),
    );
    const ts = a.chart.timeScale();
    const pad = tf === "1H" ? 26 : 8;
    if (overlays.focus !== null && overlays.focus >= 0)
      ts.setVisibleLogicalRange({
        from: Math.max(0, overlays.focus - (tf === "1H" ? 8 : 25)),
        to: bars.length + pad,
      });
    else if (!pick && !practicing)
      ts.setVisibleLogicalRange({
        from: Math.max(0, bars.length - (tf === "1H" ? 160 : 90)),
        to: bars.length + pad,
      });
  }, [overlays, bars, pick, tf, practicing]);

  const signalsToday = read.signals.filter((s) => s.time === read.bar?.time);
  const shown = levels.filter((l) => l.verdict !== "pass" || layers.has("passed"));

  const modeSwitch = (
    <div className="flex shrink-0 rounded-full bg-raised p-0.5 text-[13px] font-semibold" role="group" aria-label="Mode">
      {(["study", "practice"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => (m === "practice" ? startPractice() : setMode("study"))}
          className={cn("rounded-full px-3 py-1 capitalize transition-colors duration-200 motion-safe:active:scale-[0.96]", mode === m ? "bg-brand text-black" : "text-white/55 hover:text-white")}
        >
          {m}
        </button>
      ))}
    </div>
  );
  const tfSwitch = (
    <div className="flex shrink-0 gap-1 text-[14px]" role="group" aria-label="Timeframe">
      {(["1H", "1D"] as const).map((t) => (
        <button key={t} type="button" aria-pressed={tf === t} onClick={() => setTf(t)} className={cn("rounded-md px-2 py-1 font-semibold", tf === t ? "bg-white/[0.08] text-white" : "text-white/35 hover:text-white/70")}>
          {t}
        </button>
      ))}
    </div>
  );
  const s0 = focus ? suggest(focus, focusRules) : null;
  const peek = mode === "practice" ? (q && drill ? q.ask(drill.level) : "Practice") : signalText ? signalText.title : s0 ? `Suggestion: ${s0.head}` : "Suggestion: Stand aside";
  const panelBody = (
    <>
      {mode === "study" && (
        <dl className="mb-4 flex gap-6 text-[12px]">
          <div>
            <dt className="text-white/40">Daily bias</dt>
            <dd className={cn("font-semibold", read.bias === "bullish" ? "text-up" : read.bias === "bearish" ? "text-down" : "text-white/55")}>
              {read.bias === "bullish" ? "Buys" : read.bias === "bearish" ? "Sells" : "None"}
              {signalsToday[0] && <span className="font-normal text-white/40"> · {signalsToday.map((x) => x.name).join(", ")}</span>}
            </dd>
          </div>
          <div>
            <dt className="text-white/40">ATR used</dt>
            <dd className={cn("font-semibold", (read.usedPct ?? 0) >= 100 ? "text-down" : "text-white")}>{read.usedPct !== null ? `${read.usedPct.toFixed(0)}%` : "n/a"}</dd>
          </div>
        </dl>
      )}
      {mode === "practice" ? (
        <Practice
          drill={drill}
          index={drillAt}
          total={drills.length}
          tf={tf}
          answers={answers}
          rules={drillRules}
          tally={tally}
          revealed={revealed}
          live={drill?.cut === hourly.length}
          onChoice={(choice) => answer({ choice })}
          onRestart={() => goDrill(drillAt)}
          onReveal={() => setRevealed(true)}
          onNext={() => goDrill((drillAt + 1) % Math.max(1, drills.length))}
        />
      ) : (
        <div className="space-y-4">
          {signalText && pick?.kind === "signal" ? (
            <div>
              <div className="flex items-center gap-3">
                <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-white">{signalText.title}</p>
                <CloseButton onClick={() => select(null)} />
              </div>
              {signalText.steps.map((x) => (
                <p key={x.head} className="mt-1 text-[14px] leading-[21px] text-white/70">
                  <span className="font-semibold text-white">{x.head}. </span>
                  {x.body}
                </p>
              ))}
            </div>
          ) : focus ? (
            <SuggestionCard
              level={focus}
              s={s0!}
              rules={focusRules}
              action={
                pick ? (
                  <CloseButton onClick={() => select(null)} />
                ) : (
                  <button type="button" onClick={() => select({ kind: "level", level: focus })} className="text-[13px] font-medium text-white/55 hover:text-white">
                    Draw on chart
                  </button>
                )
              }
            />
          ) : (
            <p className="text-[14px] text-white/55">
              <span className="font-semibold text-white">Suggestion: Stand aside.</span> No hourly level near price.
            </p>
          )}
          {(shown.length > 0 || signalsToday.length > 0) && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Levels near price</p>
              <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1 xl:flex-wrap">
                {shown.map((l) => {
                  const on = focus === l;
                  return (
                    <button
                      key={`${l.type}${l.side}${l.price}`}
                      type="button"
                      aria-pressed={on}
                      onClick={() => select({ kind: "level", level: l })}
                      className={cn(
                        "shrink-0 rounded-xl px-3 py-2 text-left ring-1 transition duration-150 motion-safe:active:scale-[0.98]",
                        on ? "bg-white/[0.08] ring-white/30" : "bg-raised ring-transparent hover:bg-white/[0.08]",
                      )}
                    >
                      <span className="flex items-center gap-2 text-[12px] font-semibold">
                        <RuleCount rules={checklist(l, read)} />
                        {l.status === "at-level" && l.type === "inverse" && <span className="rounded-full bg-brand px-1.5 text-[11px] text-black">At level now</span>}
                      </span>
                      <span className="block text-[14px] text-white">
                        <span className={l.side === "buy" ? "text-up" : "text-down"}>{l.side === "buy" ? "Buy" : "Sell"}</span> {levelName(l)} <span className="font-num font-semibold">{fmtPrice(l.price)}</span>
                      </span>
                      <span className="block text-[12px] text-white/40">
                        Strength {l.score}
                        {l.r !== null ? ` · ${l.r.toFixed(2)}R` : ""}
                      </span>
                    </button>
                  );
                })}
                {signalsToday.map((s: Signal) => (
                  <button
                    key={`${s.kind}${s.dir}`}
                    type="button"
                    onClick={() => select({ kind: "signal", signal: s })}
                    className="shrink-0 rounded-xl bg-raised px-3 py-2 text-left transition duration-150 hover:bg-white/[0.08] motion-safe:active:scale-[0.98]"
                  >
                    <span className="block text-[12px] font-semibold text-white/40">Daily signal</span>
                    <span className={cn("block text-[14px]", s.shallow ? "text-white/55" : s.dir === "bullish" ? "text-up" : "text-down")}>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-full flex-col bg-panel">
      {/* Toolbar */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.07] px-2 sm:gap-3 sm:px-3">
        {picker}
        <span className="hidden h-5 w-px bg-white/10 sm:block" />
        <div className="hidden items-center gap-3 sm:flex">
          {tfSwitch}
          {mode === "study" && <LayersMenu layers={layers} onChange={setLayers} />}
        </div>
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          {modeSwitch}
          <button
            type="button"
            aria-pressed={panel}
            aria-label={panel ? "Hide side panel" : "Show side panel"}
            title={panel ? "Hide side panel" : "Show side panel"}
            onClick={() => onPanel(!panel)}
            className={cn("hidden size-8 items-center justify-center rounded-lg lg:flex", panel ? "bg-white/[0.08] text-white" : "text-white/55 hover:bg-white/[0.06] hover:text-white")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
              <path d="M10 2.5v11" />
            </svg>
          </button>
        </div>
        {/* Phones: one row, everything else behind the menu. */}
        <div className="ml-auto sm:hidden">
          <Popover
            label="Chart settings"
            align="right"
            triggerClass={(open) => cn("flex size-9 items-center justify-center rounded-lg text-[18px] leading-none", open ? "bg-white/[0.1] text-white" : "text-white/70")}
            trigger={() => <span aria-label="Chart settings">⋯</span>}
          >
            {() => (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {modeSwitch}
                  {tfSwitch}
                </div>
                {mode === "study" && <LayerList layers={layers} onChange={setLayers} />}
              </div>
            )}
          </Popover>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          {bars.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[14px] text-white/40">{loading ? "Loading candles" : "No candles stored for this market yet."}</div>
          ) : (
            <div ref={el} className="h-full w-full" />
          )}
          {loading && bars.length > 0 && <div className="pointer-events-none absolute inset-0 bg-black/30 motion-safe:animate-pulse" aria-hidden />}
          {practicing && q && <p className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-5rem)] rounded-full bg-black/70 px-3 py-1 text-[13px] font-medium text-white">{q.ask(drill!.level)}</p>}
          {mode === "study" && !pick && bars.length > 0 && <p className="pointer-events-none absolute left-3 top-3 text-[12px] text-white/40">Tap a level on the chart to draw its trade</p>}
        </div>

        {/* Docked side panel from lg up. */}
        {panel && (
          <aside aria-label={mode === "practice" ? "Practice" : "Suggestion"} className="hidden w-[380px] shrink-0 overflow-y-auto border-l border-white/[0.07] p-4 lg:block">
            {panelBody}
          </aside>
        )}
      </div>

      {/* Below lg: a peek bar that opens the panel as a bottom sheet; practice stays inline so the chart can be tapped. */}
      {mode === "practice" ? (
        <div className="max-h-[42%] shrink-0 overflow-y-auto border-t border-white/[0.07] p-4 lg:hidden">{panelBody}</div>
      ) : (
        <button type="button" onClick={() => setSheet(true)} aria-expanded={sheet} className="flex h-12 shrink-0 items-center gap-3 border-t border-white/[0.07] px-4 text-left lg:hidden">
          {s0 && <span className={cn("size-2 shrink-0 rounded-full", s0.verdict === "order" ? "bg-brand" : s0.verdict === "watch" ? "bg-white" : "bg-white/30")} aria-hidden />}
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-white">{peek}</span>
          <span className="text-[13px] text-white/45">Details</span>
        </button>
      )}
      {sheet && mode === "study" && <Sheet onClose={() => setSheet(false)}>{panelBody}</Sheet>}
    </div>
  );
}

/** Phone bottom sheet for the side panel. Escape or the backdrop closes it. */
function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="lg:hidden">
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-label="Suggestion"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-2xl bg-raised p-4 pb-6 outline-none ring-1 ring-white/10 motion-safe:animate-[rise_150ms_ease-out]"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" aria-hidden />
        {children}
        <button type="button" onClick={onClose} className="mt-4 h-10 w-full rounded-full bg-white text-[14px] font-semibold text-black">
          Done
        </button>
      </div>
    </div>
  );
}

const CloseButton = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="shrink-0 text-[13px] text-white/40 hover:text-white">
    Close
  </button>
);

/** Layers dropdown: grouped checkboxes with a line each. A popover on desktop, a bottom sheet on phones. */
function LayersMenu({ layers, onChange }: { layers: Set<Layer>; onChange: (s: Set<Layer>) => void }) {
  return (
    <Popover
      label="Layers on the chart"
      panelClass="sm:w-80"
      triggerClass={(open) =>
        cn(
          "flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium ring-1 transition duration-150 motion-safe:active:scale-[0.97]",
          open ? "bg-white text-black ring-white" : "text-white ring-white/[0.14] hover:bg-raised",
        )
      }
      trigger={(open) => (
        <>
          Layers <span className={open ? "text-black/50" : "text-white/40"}>· {layers.size}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className={cn("transition-transform", open && "rotate-180")}>
            <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </>
      )}
    >
      {() => <LayerList layers={layers} onChange={onChange} />}
    </Popover>
  );
}

function LayerList({ layers, onChange }: { layers: Set<Layer>; onChange: (s: Set<Layer>) => void }) {
  const toggle = (k: Layer) => {
    const n = new Set(layers);
    if (n.has(k)) n.delete(k);
    else n.add(k);
    onChange(n);
  };
  return (
    <div>
      <div className="mb-1 flex items-center gap-3 px-1">
        <span className="flex-1 text-[14px] font-semibold text-white sm:text-[13px]">Layers · {layers.size}</span>
        <button type="button" onClick={() => onChange(new Set(LAYERS.map((l) => l.key)))} className="text-[13px] text-white/55 hover:text-white">
          All
        </button>
        <button type="button" onClick={() => onChange(new Set(DEFAULT_LAYERS))} className="text-[13px] text-white/55 hover:text-white">
          Reset
        </button>
      </div>
      {LAYER_GROUPS.map((g) => (
        <fieldset key={g} className="mt-2">
          <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">{g}</legend>
          {LAYERS.filter((l) => l.group === g).map((l) => (
            <label key={l.key} className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-2 hover:bg-white/[0.05] sm:py-1.5">
              <input type="checkbox" checked={layers.has(l.key)} onChange={() => toggle(l.key)} className="mt-0.5 size-4 shrink-0 accent-[#FFD400]" />
              <span className="min-w-0">
                <span className="block text-[14px] text-white">{l.label}</span>
                <span className="block text-[12px] leading-4 text-white/45">{l.desc}</span>
              </span>
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

function Practice({
  drill,
  index,
  total,
  tf,
  answers,
  rules,
  tally,
  revealed,
  live,
  onChoice,
  onRestart,
  onReveal,
  onNext,
}: {
  live: boolean;
  drill: Drill | null;
  index: number;
  total: number;
  tf: "1H" | "1D";
  answers: Answer[];
  rules: Rule[];
  tally: { right: number; asked: number };
  revealed: boolean;
  onChoice: (yes: boolean) => void;
  onRestart: () => void;
  onReveal: () => void;
  onNext: () => void;
}) {
  if (!drill) return <p className="py-2 text-[14px] text-white/55">No clean breaks in this market&apos;s recent history to practise on. Try another market from the board.</p>;
  if (tf !== "1H") return <p className="py-2 text-[14px] text-white/55">Practice runs on the 1H chart. Switch back to 1H to continue.</p>;
  const level = drill.level;
  const q = QUESTIONS[answers.length];
  const last = answers.at(-1);
  const score = answers.filter((a) => a.ok).length;
  const o = drill.outcome;
  const story = live
    ? "This is today's chart. Nobody knows what happens next yet, so check back later."
    : o.kind === "win"
      ? `Price came back on ${wib(o.fillTime!)} and reached the target on ${wib(o.exitTime!)}: +${o.r?.toFixed(2)}R.`
      : o.kind === "loss"
        ? `Price came back on ${wib(o.fillTime!)} and hit the stop on ${wib(o.exitTime!)}: -1R. Rules give an edge over many trades, not a guarantee on one.`
        : o.kind === "running"
          ? `Filled on ${wib(o.fillTime!)}, still between stop and target.`
          : "Price never came back to the level. No fill, no trade: a limit order costs nothing when it misses.";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
          Drill {index + 1} of {total} · {wib(drill.level.thrust?.time ?? "", false)}
        </span>
        <div className="flex gap-1" aria-label={`Question ${Math.min(answers.length + 1, QUESTIONS.length)} of ${QUESTIONS.length}`}>
          {QUESTIONS.map((x, i) => (
            <span
              key={x.key}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors duration-300",
                i < answers.length ? (answers[i]!.ok ? "bg-up" : "bg-down") : i === answers.length ? "bg-white/60 motion-safe:animate-pulse" : "bg-white/10",
              )}
            />
          ))}
        </div>
        <span className="ml-auto text-[12px] text-white/40">
          Session <span className="font-num text-[14px] font-semibold text-white">{tally.right}</span>/{tally.asked}
        </span>
      </div>
      <p className="text-[15px] font-semibold text-white">{q ? q.ask(level) : `Done: ${score} of ${QUESTIONS.length} right`}</p>
      {last && (
        <p key={answers.length} className={cn("text-[14px] leading-[21px] motion-safe:animate-[rise_200ms_ease-out]", last.ok ? "text-up" : "text-white/80")}>
          <span className={cn("mr-1 font-semibold", last.ok ? "text-up" : "text-down")}>{last.ok ? "Right." : "Not quite."}</span>
          {last.feedback.replace(/^Yes\. |^Yes, /, "")}
        </p>
      )}
      {q && !q.tap && (
        <div className="flex flex-wrap gap-2">
          {(q.key === "naked"
            ? [
                ["Yes, it came back", true],
                ["No, still naked", false],
              ]
            : [
                ["Yes, it qualifies", true],
                ["No, it doesn't", false],
              ]
          ).map(([label, v]) => (
            <button
              key={String(label)}
              type="button"
              onClick={() => onChoice(v as boolean)}
              className="h-10 rounded-full px-4 text-[14px] font-medium text-white ring-1 ring-white/[0.14] transition hover:bg-raised motion-safe:active:scale-[0.97]"
            >
              {label as string}
            </button>
          ))}
        </div>
      )}
      {q?.tap && <p className="text-[13px] text-white/40">Tap the chart to answer.</p>}
      {!q && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {!revealed && !live && (
              <button type="button" onClick={onReveal} className="h-10 rounded-full bg-brand px-4 text-[14px] font-semibold text-black transition motion-safe:active:scale-[0.97]">
                Show what happened next
              </button>
            )}
            <button type="button" onClick={onNext} className="h-10 rounded-full px-4 text-[14px] font-medium text-white ring-1 ring-white/[0.14] transition hover:bg-raised motion-safe:active:scale-[0.97]">
              Next drill
            </button>
            <button type="button" onClick={onRestart} className="text-[13px] text-white/40 hover:text-white">
              Try this one again
            </button>
          </div>
          {(revealed || live) && <p className={cn("text-[14px] leading-[21px] motion-safe:animate-[rise_200ms_ease-out]", o.kind === "win" ? "text-up" : o.kind === "loss" ? "text-down" : "text-white/70")}>{story}</p>}
          <Checklist rules={rules} />
        </>
      )}
    </div>
  );
}
