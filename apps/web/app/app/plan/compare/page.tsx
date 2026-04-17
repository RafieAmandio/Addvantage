"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getAllPlans,
  getLatestPlan,
  getPlanById,
  computePlanOutcome,
} from "@/features/plan/mock";
import {
  DataLabel,
  SectionNumber,
  BiasBadge,
} from "@/components/ui/Marker";
import { formatDate, cn } from "@/lib/cn";
import type { TradingPlan, TradingSetup } from "@/lib/mock/types";

export default function PlanComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-lime">
            <span className="led lime" />
            PREPARING COMPARE
          </div>
        </div>
      }
    >
      <PlanCompareView />
    </Suspense>
  );
}

function PlanCompareView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const allPlans = getAllPlans();
  const latest = getLatestPlan();

  const [a, setA] = useState<string | null>(() => searchParams.get("a"));
  const [b, setB] = useState<string | null>(() => searchParams.get("b"));

  useEffect(() => {
    const sp = new URLSearchParams();
    if (a) sp.set("a", a);
    if (b) sp.set("b", b);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [a, b, pathname, router]);

  const planA = a ? getPlanById(a) : null;
  const planB = b ? getPlanById(b) : null;

  // Common instruments — the whole point of a compare view
  const commonInstruments = useMemo(() => {
    if (!planA || !planB) return [];
    const aInstr = new Set(planA.setups.map((s) => s.instrument));
    return planB.setups
      .map((s) => s.instrument)
      .filter((i) => aInstr.has(i));
  }, [planA, planB]);

  const outcomeA = planA ? computePlanOutcome(planA) : null;
  const outcomeB = planB ? computePlanOutcome(planB) : null;
  const bothClosed = outcomeA && outcomeB;
  const deltaR = bothClosed ? outcomeA.totalR - outcomeB.totalR : null;

  return (
    <div className="bg-grid-fine">
      {/* Hero */}
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <DataLabel>Transmission TX-03 · Compare</DataLabel>
              <h1 className="mt-2 font-display text-5xl text-paper">
                Plan <span className="italic text-lime">comparison</span>
              </h1>
              <p className="mt-2 max-w-2xl font-display text-lg text-paper/60">
                Put two trading plans side by side. Common instruments
                highlight, R totals compare, thesis lines up for reading.
              </p>
            </div>
            <Link
              href="/app/plan/archive"
              className="border border-lime/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
            >
              ← Archive
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Pickers */}
        <div className="mb-6 grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <PlanPicker
            label="Plan A"
            value={a}
            onChange={setA}
            plans={allPlans}
            latest={latest}
            excludeId={b}
          />
          <div className="flex justify-center sm:pb-1">
            <button
              onClick={() => {
                const nextA = b;
                const nextB = a;
                setA(nextA);
                setB(nextB);
              }}
              disabled={!a || !b}
              title="Swap A and B"
              aria-label="Swap plans"
              className="flex items-center gap-2 border border-ink-3 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime disabled:cursor-default disabled:opacity-30"
            >
              <span className="text-base leading-none">⇄</span>
              <span className="sm:hidden">Swap</span>
            </button>
          </div>
          <PlanPicker
            label="Plan B"
            value={b}
            onChange={setB}
            plans={allPlans}
            latest={latest}
            excludeId={a}
          />
        </div>

        {!a || !b ? (
          <div className="border border-ink-3 bg-ink-2/40 p-12 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
              ● PICK TWO PLANS
            </div>
            <div className="mt-3 font-display text-2xl text-paper">
              Select a plan for each side to begin.
            </div>
            <p className="mt-2 max-w-md mx-auto font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              The desk uses compare to pattern-match across recent plans —
              does this thesis rhyme with the last one, are we leaning the
              same way, are the invalidations consistent?
            </p>
          </div>
        ) : !planA || !planB ? (
          <div className="border border-blood bg-blood/5 p-8 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood">
              ● INVALID PLAN ID
            </div>
            <div className="mt-3 font-display text-2xl text-paper">
              One or both IDs don't match a known plan.
            </div>
          </div>
        ) : (
          <>
            {/* Top summary strip — R delta + common instruments + setup counts */}
            <div className="mb-6 grid grid-cols-1 gap-px bg-ink-3 md:grid-cols-3">
              <SummaryCell
                label="A vs B · R delta"
                value={
                  bothClosed && deltaR !== null
                    ? (deltaR >= 0 ? "+" : "") + deltaR.toFixed(1) + "R"
                    : "—"
                }
                valueTone={
                  bothClosed && deltaR !== null
                    ? deltaR > 0
                      ? "moss"
                      : deltaR < 0
                      ? "blood"
                      : "muted"
                    : "muted"
                }
                sub={
                  bothClosed && outcomeA && outcomeB
                    ? `${outcomeA.totalRLabel} vs ${outcomeB.totalRLabel}`
                    : outcomeA
                    ? `A closed ${outcomeA.totalRLabel} · B live`
                    : outcomeB
                    ? `A live · B closed ${outcomeB.totalRLabel}`
                    : "Both plans still live"
                }
              />
              <SummaryCell
                label="Common instruments"
                value={
                  commonInstruments.length > 0
                    ? String(commonInstruments.length)
                    : "—"
                }
                valueTone={commonInstruments.length > 0 ? "lime" : "muted"}
                sub={
                  commonInstruments.length > 0
                    ? commonInstruments.join(" · ")
                    : "No shared instruments"
                }
              />
              <SummaryCell
                label="Setup counts"
                value={`${planA.setups.length} / ${planB.setups.length}`}
                valueTone="paper"
                sub={`${planA.setups.length} in A · ${planB.setups.length} in B`}
              />
            </div>

            {/* Common instruments chip row (still useful for quick glance) */}
            {commonInstruments.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-1.5">
                {commonInstruments.map((i) => (
                  <span
                    key={i}
                    className="border border-lime bg-lime/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest2 text-lime"
                  >
                    ★ {i}
                  </span>
                ))}
              </div>
            )}

            {/* Two-column compare */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <PlanColumn
                plan={planA}
                isLatest={planA.id === latest.id}
                highlightInstruments={commonInstruments}
              />
              <PlanColumn
                plan={planB}
                isLatest={planB.id === latest.id}
                highlightInstruments={commonInstruments}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  valueTone,
  sub,
}: {
  label: string;
  value: string;
  valueTone: "moss" | "blood" | "lime" | "paper" | "muted";
  sub: string;
}) {
  const toneClass =
    valueTone === "moss"
      ? "text-moss"
      : valueTone === "blood"
      ? "text-blood"
      : valueTone === "lime"
      ? "text-lime"
      : valueTone === "paper"
      ? "text-paper"
      : "text-paper/30";
  return (
    <div className="bg-ink p-5">
      <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
        {label}
      </div>
      <div className={cn("mt-1 font-display text-3xl", toneClass)}>
        {value}
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
        {sub}
      </div>
    </div>
  );
}

function PlanPicker({
  label,
  value,
  onChange,
  plans,
  latest,
  excludeId,
}: {
  label: string;
  value: string | null;
  onChange: (id: string | null) => void;
  plans: TradingPlan[];
  latest: TradingPlan;
  excludeId: string | null;
}) {
  return (
    <label className="block">
      <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
        {label}
      </div>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="mt-1 w-full border border-ink-3 bg-ink-2 px-3 py-2 font-mono text-sm text-paper outline-none focus:border-lime"
      >
        <option value="">— pick a plan —</option>
        {plans.map((p) => {
          const isLatest = p.id === latest.id;
          const disabled = p.id === excludeId;
          return (
            <option key={p.id} value={p.id} disabled={disabled}>
              {p.id} · {formatDate(p.date)} · {p.horizon}
              {isLatest ? " · LATEST" : ""}
              {disabled ? " · already in other slot" : ""}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function PlanColumn({
  plan,
  isLatest,
  highlightInstruments,
}: {
  plan: TradingPlan;
  isLatest: boolean;
  highlightInstruments: string[];
}) {
  const outcome = computePlanOutcome(plan);
  const longs = plan.setups.filter((s) => s.direction === "long").length;
  const shorts = plan.setups.filter((s) => s.direction === "short").length;

  return (
    <article className="border border-ink-3 bg-ink-2/20">
      {/* Header */}
      <div className="border-b border-ink-3 bg-ink-2/60 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/app/plan/${plan.id}`}
              className="font-mono text-[10px] uppercase tracking-widest2 text-lime hover:underline"
            >
              {plan.id}
            </Link>
            {isLatest ? (
              <span className="border border-lime bg-lime/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-lime">
                ● LATEST
              </span>
            ) : (
              <span className="border border-ink-3 bg-ink px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/50">
                ARCHIVE
              </span>
            )}
          </div>
          {outcome && !isLatest && (
            <div
              className={cn(
                "font-display text-2xl",
                outcome.totalR > 0
                  ? "text-moss"
                  : outcome.totalR < 0
                  ? "text-blood"
                  : "text-paper/60"
              )}
            >
              {outcome.totalRLabel}
            </div>
          )}
        </div>
        <div className="mt-1 font-display text-2xl text-paper">
          {formatDate(plan.date)}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
          <span>{plan.horizon}</span>
          <span className="text-lime/40">·</span>
          <span>by {plan.authoredBy}</span>
          <span className="text-lime/40">·</span>
          <span className="text-moss">▲ {longs}</span>
          <span className="text-lime">▼ {shorts}</span>
        </div>
      </div>

      {/* Thesis */}
      <div className="border-b border-ink-3 p-5">
        <DataLabel>Thesis</DataLabel>
        <p className="mt-2 font-display text-base leading-relaxed text-paper/90">
          {plan.thesis}
        </p>
      </div>

      {/* Setups list — compact for side-by-side */}
      <div className="p-5">
        <DataLabel>Setups · {plan.setups.length}</DataLabel>
        <div className="mt-3 space-y-2">
          {plan.setups.map((s) => (
            <CompactSetup
              key={s.id}
              setup={s}
              highlighted={highlightInstruments.includes(s.instrument)}
              planId={plan.id}
            />
          ))}
        </div>
      </div>

      {/* Risks */}
      {plan.risks.length > 0 && (
        <div className="border-t border-ink-3 bg-ink-2/30 p-5">
          <DataLabel>Risks · {plan.risks.length}</DataLabel>
          <ul className="mt-2 space-y-1 text-sm text-paper/70">
            {plan.risks.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono text-[10px] text-blood">
                  R0{i + 1}
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function CompactSetup({
  setup: s,
  highlighted,
  planId,
}: {
  setup: TradingSetup;
  highlighted: boolean;
  planId: string;
}) {
  const status = s.outcome ?? "live";
  const isWin = status === "win";
  const isLoss = status === "loss" || status === "stopped";

  return (
    <Link
      href={`/app/plan/${planId}#${s.id}`}
      className={cn(
        "block border p-3 transition-colors",
        highlighted
          ? "border-lime bg-lime/5 hover:bg-lime/10"
          : "border-ink-3 bg-ink hover:bg-ink-2"
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
              {s.id}
            </span>
            <span className="font-display text-base text-paper">
              {highlighted && "★ "}
              {s.instrument}
            </span>
            <span
              className={cn(
                "font-mono text-[9px] uppercase tracking-widest2",
                s.direction === "long" ? "text-moss" : "text-lime"
              )}
            >
              {s.direction}
            </span>
            <BiasBadge bias={s.bias} />
          </div>
          <div className="mt-1 line-clamp-2 font-mono text-[10px] text-paper/60">
            {s.rationale}
          </div>
        </div>
        {s.outcomeR && status !== "skipped" && (
          <div
            className={cn(
              "shrink-0 font-display text-lg",
              isWin
                ? "text-moss"
                : isLoss
                ? "text-blood"
                : "text-paper/60"
            )}
          >
            {s.outcomeR}
          </div>
        )}
      </div>
    </Link>
  );
}
