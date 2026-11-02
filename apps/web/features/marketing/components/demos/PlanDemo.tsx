"use client";

import { cn } from "@/lib/cn";
import type { PlanData } from "@/features/marketing/lib/landing";
import { useStory } from "@/features/marketing/lib/use-story";
import { Panel, Pointer } from "./Panel";

const GAPS = [1100, 1500, 1900, 1500];

/** The journal's plan check: 3% risk is refused, the tier's 1.5% saves. Rules come from the app's checkPlan. */
export function PlanDemo({ d, onLoop }: { d: PlanData; onLoop?: () => void }) {
  const [ref, step] = useStory(GAPS, 4200, onLoop);
  const state = step === 0 ? null : step <= 2 ? d.over : d.ok;
  const risk = state?.risk ?? "";
  const field = "flex flex-col gap-1 rounded-[6px] border border-white/10 bg-black/40 px-2.5 py-2";
  const lab = "font-mono text-[10px] uppercase tracking-[0.12em] text-white/50";
  const val = "font-mono text-sm font-bold tabular-nums";

  return (
    <Panel ref={ref} title="Journal, check my plan" meta={<span className="text-brand">Execute</span>} className="h-full">
      <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-6">
        <div className={field}>
          <span className={lab}>Market</span>
          <span className={val}>{d.sym}</span>
        </div>
        <div className={field}>
          <span className={lab}>Side</span>
          <span className={cn(val, d.side === "buy" ? "text-tv-up" : "text-tv-down")}>{d.side.toUpperCase()}</span>
        </div>
        <div className={field}>
          <span className={lab}>Entry</span>
          <span className={val}>{d.entry}</span>
        </div>
        <div className={field}>
          <span className={lab}>Stop</span>
          <span className={val}>{d.stop}</span>
        </div>
        <div className={field}>
          <span className={lab}>Target</span>
          <span className={val}>{d.target}</span>
        </div>
        <div className={cn(field, "transition-colors duration-300", step >= 1 && step <= 2 && "border-tv-down bg-blood/20", step >= 3 && "border-tv-up/60")}>
          <span className={lab}>Risk %</span>
          <span className={val}>
            {risk}
            {(step === 0 || step === 1 || step === 3) && <span className="lv-caret ml-px inline-block h-[1em] w-[2px] translate-y-[2px] bg-brand" aria-hidden />}
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-1 px-3">
        {(state?.rules ?? d.ok.rules).map((r, i) => {
          const met = state ? r.met : null;
          return (
            <li key={r.rule} className={cn("grid grid-cols-[1.25rem_1fr] gap-x-2 rounded-[6px] px-2 py-1.5 font-mono text-[12px] leading-snug transition-colors duration-300", met === false && "bg-blood/25")}>
              <span key={`${step}-${met}`} className={cn("lv-in font-bold", met === true ? "text-tv-up" : met === false ? "text-tv-down" : "text-white/30")} style={{ ["--i" as string]: i }}>
                {met === true ? "✓" : met === false ? "✕" : "·"}
              </span>
              <span>
                <span className={met === false ? "text-tv-down" : "text-white"}>{r.rule}</span>
                <span className="block text-white/50">{state ? r.evidence : "Not checked yet"}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="relative mt-auto flex flex-col gap-2 p-3">
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          key={step === 2 ? "shake" : "still"}
          className={cn(
            "w-full rounded-[8px] px-4 py-3 font-mono text-sm font-bold transition-colors duration-300",
            step === 2 ? "lv-shake bg-tv-down text-white" : step >= 4 ? "bg-tv-up text-black" : "bg-brand text-black",
          )}
        >
          {step === 2 ? "Refused" : step >= 4 ? "Saved" : "Save as open"}
        </button>
        <p className={cn("min-h-[2.6em] font-mono text-[12px] leading-snug", step === 2 ? "text-tv-down" : "text-tv-up")} aria-live="off">
          {step === 2 ? d.over.refusal : step >= 4 ? d.ok.saved : ""}
        </p>
        <Pointer x={step === 2 || step >= 4 ? 70 : 88} y={step === 2 || step >= 4 ? 30 : 75} show={step === 2 || step >= 4} tap={step === 2 || step >= 4} />
      </div>
    </Panel>
  );
}
