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
import { readDaily, readLevels, type Candle, type Level, type Signal } from "@tradevantage/shared";
import { cn } from "@/lib/cn";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { BoxPrimitive } from "./BoxPrimitive";
import { LAYERS, buildOverlays, indexer, practiceOverlays, type Layer, type Pick } from "../lib/overlays";
import { explainLevel, explainSignal, levelName } from "../lib/explain";
import { checklist, type Rule } from "../lib/checklist";
import { QUESTIONS, gradeLevel, gradeNaked, gradeQualifies, gradeStop, gradeThrust, type Answer } from "../lib/practice";

const sec = (iso: string) => Math.floor(Date.parse(iso) / 1000) as UTCTimestamp;
const STYLE = { solid: LineStyle.Solid, dashed: LineStyle.Dashed, dotted: LineStyle.Dotted } as const;
const DEFAULT_LAYERS: Layer[] = ["levels", "sameway", "signals", "atr"];

const chip = (on: boolean) =>
  cn(
    "shrink-0 rounded-full px-3 py-1 text-[13px] font-medium ring-1 transition-colors focus-visible:outline-none focus-visible:ring-brand",
    on ? "bg-white text-black ring-white" : "text-white/55 ring-white/[0.14] hover:text-white",
  );

/** Chart-first view of the method: structures drawn on the candles, filters to toggle them, tap one to walk through it. */
export function MethodChart({ hourly, daily }: { hourly: Candle[]; daily: Candle[] }) {
  const read = useMemo(() => readDaily(daily), [daily]);
  const levels = useMemo(() => readLevels(hourly, read, 3), [hourly, read]);
  const [tf, setTf] = useState<"1H" | "1D">("1H");
  const [layers, setLayers] = useState<Set<Layer>>(() => new Set(DEFAULT_LAYERS));
  const [pick, setPick] = useState<Pick>(null);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"study" | "practice">("study");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const bars = tf === "1H" ? hourly : daily;

  // Practice runs on the strongest break-and-retest level on the chart.
  const drill = useMemo(() => levels.filter((l) => l.type === "inverse" && l.thrust).sort((a, b) => b.score - a.score)[0] ?? null, [levels]);
  const practicing = mode === "practice" && drill !== null && tf === "1H";
  const q = QUESTIONS[answers.length];
  const drillRules = useMemo(() => (drill ? checklist(drill, read) : []), [drill, read]);

  const answer = (a: { time?: string; price?: number; choice?: boolean }) => {
    if (!drill || !q) return;
    const graded =
      q.key === "thrust" && a.time ? gradeThrust(drill, hourly, a.time)
      : q.key === "level" && a.price !== undefined ? gradeLevel(drill, hourly, a.price, read)
      : q.key === "stop" && a.price !== undefined ? gradeStop(drill, a.price, read)
      : q.key === "naked" && a.choice !== undefined ? gradeNaked(drill, a.choice)
      : q.key === "qualifies" && a.choice !== undefined ? gradeQualifies(drill, a.choice, drillRules.filter((r) => !r.met).map((r) => r.rule))
      : null;
    if (graded) setAnswers((xs) => [...xs, graded]);
  };
  const startPractice = () => {
    setMode("practice");
    setTf("1H");
    setPick(null);
    setAnswers([]);
  };

  const overlays = useMemo(
    () => (practicing ? practiceOverlays({ bars, daily: read, level: drill!, answers }) : buildOverlays({ tf, bars, daily: read, levels, layers, pick, step })),
    [practicing, drill, answers, tf, bars, read, levels, layers, pick, step],
  );
  const story = pick?.kind === "level" ? explainLevel(pick.level, read.bias) : pick?.kind === "signal" ? explainSignal(pick.signal) : null;
  const lastStep = (story?.steps.length ?? 1) - 1;

  const select = (p: Pick) => {
    setPick(p);
    setStep(0);
    if (p?.kind === "level") setTf("1H");
    if (p?.kind === "signal") setTf("1D");
  };

  const el = useRef<HTMLDivElement>(null);
  const api = useRef<{ chart: IChartApi; series: ISeriesApi<"Candlestick">; boxes: BoxPrimitive; markers: ISeriesMarkersPluginApi<Time>; lines: IPriceLine[] } | null>(null);
  // Latest click targets for the chart's click handler, which is bound once per chart.
  const targets = useRef({ levels, signals: read.signals, tf, select, practicing, tap: q?.tap, answer });
  targets.current = { levels, signals: read.signals, tf, select, practicing, tap: q?.tap, answer };

  useEffect(() => {
    const node = el.current;
    if (!node || bars.length === 0) return;
    const ref = bars.at(-1)!.close;
    const pad = tf === "1H" ? 26 : 8;
    const prec = ref >= 1000 ? 2 : ref >= 10 ? 3 : 5;
    const chart = createChart(node, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "#121212" }, textColor: "rgba(255,255,255,.55)", fontFamily: "Geist, sans-serif", fontSize: 12, attributionLogo: false },
      grid: { vertLines: { visible: false }, horzLines: { color: "rgba(255,255,255,.1)", style: LineStyle.SparseDotted } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false, rightOffset: pad },
      crosshair: { mode: 0, vertLine: { color: "rgba(255,255,255,.3)", labelBackgroundColor: "#1A1A1A" }, horzLine: { color: "rgba(255,255,255,.3)", labelBackgroundColor: "#1A1A1A" } },
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
    series.setData(bars.map((b) => ({ time: sec(b.time), open: b.open, high: b.high, low: b.low, close: b.close })));
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
        .map((l) => ({ l, y: series.priceToCoordinate(l.price) as number | null }))
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
    a.boxes.set(overlays.boxes, bars.map((b) => sec(b.time)));
    for (const l of a.lines) a.series.removePriceLine(l);
    a.lines = overlays.lines.map((l) => a.series.createPriceLine({ price: l.price, color: l.color, lineStyle: STYLE[l.style], lineWidth: l.width ?? 1, title: l.label, axisLabelVisible: true }));
    const at = indexer(bars);
    a.markers.setMarkers(
      overlays.marks
        .map((m) => ({ i: at(m.time), m }))
        .filter((x) => x.i >= 0)
        .map(({ i, m }) => ({ time: sec(bars[i]!.time), position: m.above ? ("aboveBar" as const) : ("belowBar" as const), shape: m.above ? ("arrowDown" as const) : ("arrowUp" as const), color: m.color, text: m.text, size: 1 }))
        .sort((x, y) => x.time - y.time),
    );
    const ts = a.chart.timeScale();
    const pad = tf === "1H" ? 26 : 8;
    if (overlays.focus !== null && overlays.focus >= 0) ts.setVisibleLogicalRange({ from: Math.max(0, overlays.focus - (tf === "1H" ? 8 : 25)), to: bars.length + pad });
    else if (!pick && !practicing) ts.setVisibleLogicalRange({ from: Math.max(0, bars.length - (tf === "1H" ? 160 : 90)), to: bars.length + pad });
  }, [overlays, bars, pick, tf, practicing]);

  const toggle = (k: Layer) =>
    setLayers((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  const signalsToday = read.signals.filter((s) => s.time === read.bar?.time);
  const shown = levels.filter((l) => l.verdict !== "pass" || layers.has("passed"));

  return (
    <div className="overflow-hidden rounded-2xl bg-panel">
      {/* Filters */}
      <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
        <div className="flex shrink-0 rounded-full bg-raised p-0.5 text-[13px] font-semibold" role="group" aria-label="Mode">
          {(["study", "practice"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => (m === "practice" ? startPractice() : setMode("study"))}
              className={cn("rounded-full px-3 py-1 capitalize", mode === m ? "bg-brand text-black" : "text-white/55 hover:text-white")}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 gap-3 text-[14px]" role="group" aria-label="Timeframe">
          {(["1H", "1D"] as const).map((t) => (
            <button key={t} type="button" aria-pressed={tf === t} onClick={() => setTf(t)} className={cn("font-semibold", tf === t ? "text-white" : "text-white/30 hover:text-white/60")}>
              {t}
            </button>
          ))}
        </div>
        <span className="h-4 w-px shrink-0 bg-white/10" />
        <div className={cn("-my-1 flex min-w-0 gap-2 overflow-x-auto py-1", mode === "practice" && "hidden")} role="group" aria-label="Show on chart">
          {LAYERS.map((l) => (
            <button key={l.key} type="button" aria-pressed={layers.has(l.key)} onClick={() => toggle(l.key)} className={chip(layers.has(l.key))}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {bars.length === 0 ? (
          <div className="flex h-[62vh] min-h-[420px] items-center justify-center text-[14px] text-white/40">No candles stored for this market yet.</div>
        ) : (
          <div ref={el} className="h-[62vh] min-h-[420px] w-full" />
        )}
        {practicing && q && (
          <p className="pointer-events-none absolute left-4 top-3 rounded-full bg-black/70 px-3 py-1 text-[13px] font-medium text-white">{q.ask(drill!)}</p>
        )}
        {mode === "study" && !pick && bars.length > 0 && (
          <p className="pointer-events-none absolute left-4 top-3 text-[12px] text-white/40">Tap a level on the chart, or pick one below</p>
        )}
      </div>

      {/* Walkthrough for the picked structure, or the pickers */}
      <div className="border-t border-white/[0.07] px-4 py-3">
        {mode === "practice" ? (
          <Practice level={drill} tf={tf} answers={answers} rules={drillRules} onChoice={(choice) => answer({ choice })} onRestart={startPractice} />
        ) : story ? (
          <div>
            <div className="flex items-center gap-3">
              <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-white">{story.title}</p>
              <button type="button" onClick={() => select(null)} className="shrink-0 text-[13px] text-white/40 hover:text-white">
                Close
              </button>
            </div>
            <div className="mt-2 flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Steps">
              {story.steps.map((s, i) => (
                <button key={s.head} type="button" role="tab" aria-selected={i === step} onClick={() => setStep(i)} className={chip(i === step)}>
                  <span className="font-num mr-1">{i + 1}</span>
                  {s.head}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-3">
              <p className="min-w-0 flex-1 text-[14px] leading-[21px] text-white/70">{story.steps[step]?.body}</p>
              <div className="flex shrink-0 gap-2">
                <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)} className="h-9 rounded-full px-3 text-[13px] text-white ring-1 ring-white/[0.14] disabled:opacity-30">
                  Back
                </button>
                <button type="button" disabled={step === lastStep} onClick={() => setStep(step + 1)} className="h-9 rounded-full bg-brand px-4 text-[13px] font-semibold text-black disabled:opacity-30">
                  Next
                </button>
              </div>
            </div>
            {pick?.kind === "level" && <Checklist rules={checklist(pick.level, read)} />}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {shown.map((l) => (
              <button key={`${l.type}${l.side}${l.price}`} type="button" onClick={() => select({ kind: "level", level: l })} className="shrink-0 rounded-xl bg-raised px-3 py-2 text-left hover:bg-white/[0.08]">
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
            ))}
            {signalsToday.map((s: Signal) => (
              <button key={`${s.kind}${s.dir}`} type="button" onClick={() => select({ kind: "signal", signal: s })} className="shrink-0 rounded-xl bg-raised px-3 py-2 text-left hover:bg-white/[0.08]">
                <span className="block text-[12px] font-semibold text-white/40">Daily signal</span>
                <span className={cn("block text-[14px]", s.shallow ? "text-white/55" : s.dir === "bullish" ? "text-up" : "text-down")}>{s.name}</span>
              </button>
            ))}
            {shown.length === 0 && signalsToday.length === 0 && <p className="py-2 text-[14px] text-white/40">Nothing near price. Turn on Passed levels to see what was ruled out.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function RuleCount({ rules }: { rules: Rule[] }) {
  const met = rules.filter((r) => r.met).length;
  return <span className={met === rules.length ? "text-brand" : "text-white/55"}>{met === rules.length ? "Every rule holds" : `${met} of ${rules.length} rules`}</span>;
}

function Checklist({ rules }: { rules: Rule[] }) {
  return (
    <div className="mt-4">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
        Rules · <RuleCount rules={rules} />
      </p>
      <ul className="mt-1 grid gap-x-6 sm:grid-cols-2">
        {rules.map((r) => (
          <li key={r.rule} className="flex gap-2 border-b border-white/[0.07] py-2 text-[13px]">
            <span className={cn("w-4 shrink-0 font-semibold", r.met ? "text-up" : "text-down")} aria-label={r.met ? "met" : "not met"}>
              {r.met ? "✓" : "✕"}
            </span>
            <span className="min-w-0">
              <span className="block text-white">{r.rule}</span>
              <span className="block text-white/45">{r.evidence}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Practice({ level, tf, answers, rules, onChoice, onRestart }: { level: Level | null; tf: "1H" | "1D"; answers: Answer[]; rules: Rule[]; onChoice: (yes: boolean) => void; onRestart: () => void }) {
  if (!level) return <p className="py-2 text-[14px] text-white/55">No clean break on this chart right now to practise on. Try another market from the board.</p>;
  if (tf !== "1H") return <p className="py-2 text-[14px] text-white/55">Practice runs on the 1H chart. Switch back to 1H to continue.</p>;
  const q = QUESTIONS[answers.length];
  const last = answers.at(-1);
  const score = answers.filter((a) => a.ok).length;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex gap-1" aria-label={`Question ${Math.min(answers.length + 1, QUESTIONS.length)} of ${QUESTIONS.length}`}>
          {QUESTIONS.map((x, i) => (
            <span key={x.key} className={cn("h-1.5 w-6 rounded-full", i < answers.length ? (answers[i]!.ok ? "bg-up" : "bg-down") : i === answers.length ? "bg-white/60" : "bg-white/10")} />
          ))}
        </div>
        <p className="min-w-0 flex-1 text-[15px] font-semibold text-white">{q ? q.ask(level) : `Done: ${score} of ${QUESTIONS.length} right`}</p>
        <button type="button" onClick={onRestart} className="shrink-0 text-[13px] text-white/40 hover:text-white">
          Start again
        </button>
      </div>
      {last && (
        <p className={cn("text-[14px] leading-[21px]", last.ok ? "text-up" : "text-white/80")}>
          <span className={cn("mr-1 font-semibold", last.ok ? "text-up" : "text-down")}>{last.ok ? "Right." : "Not quite."}</span>
          {last.feedback.replace(/^Yes\. |^Yes, /, "")}
        </p>
      )}
      {q && !q.tap && (
        <div className="flex gap-2">
          {(q.key === "naked" ? [["Yes, it came back", true], ["No, still naked", false]] : [["Yes, it qualifies", true], ["No, it doesn't", false]]).map(([label, v]) => (
            <button key={String(label)} type="button" onClick={() => onChoice(v as boolean)} className="h-10 rounded-full px-4 text-[14px] font-medium text-white ring-1 ring-white/[0.14] hover:bg-raised">
              {label as string}
            </button>
          ))}
        </div>
      )}
      {q?.tap && <p className="text-[13px] text-white/40">Tap the chart to answer.</p>}
      {!q && <Checklist rules={rules} />}
    </div>
  );
}
