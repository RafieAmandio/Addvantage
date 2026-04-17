"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getAllPlans,
  getLatestPlan,
  computePlanOutcome,
} from "@/features/plan/mock";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { Highlight } from "@/components/ui/Highlight";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { BackToTop } from "@/components/ui/BackToTop";
import { formatDate, cn } from "@/lib/cn";
import { useToast } from "@/lib/toast";
import type { TradingPlan } from "@/lib/mock/types";

function planToDigestMarkdown(plan: TradingPlan): string {
  const out = computePlanOutcome(plan);
  const header = `## ${plan.id} · ${formatDate(plan.date)} · ${plan.horizon}`;
  const totalLine = out
    ? `**Outcome:** ${out.totalRLabel}  ·  ${out.wins}W / ${out.losses}L${out.flat > 0 ? ` / ${out.flat}F` : ""}${out.skipped > 0 ? ` / ${out.skipped}S` : ""}`
    : `**Status:** LIVE — no outcome yet`;
  const setupLines = plan.setups.map((s) => {
    const badge = s.outcome
      ? ` — **${s.outcome.toUpperCase()}**${s.outcomeR ? ` \`${s.outcomeR}\`` : ""}`
      : "";
    return `- **${s.id} ${s.instrument} ${s.direction}**${badge}: ${s.rationale}`;
  });
  return [
    header,
    ``,
    `**Thesis:** ${plan.thesis}`,
    ``,
    totalLine,
    ``,
    ...setupLines,
    ``,
  ].join("\n");
}

function archiveDigestMarkdown(plans: TradingPlan[], latestId: string): string {
  const closed = plans.filter((p) => p.id !== latestId);
  const totalR = closed.reduce((acc, p) => {
    const o = computePlanOutcome(p);
    return o ? acc + o.totalR : acc;
  }, 0);
  const dateRange =
    closed.length > 0
      ? `${formatDate(closed[closed.length - 1].date)} → ${formatDate(closed[0].date)}`
      : "—";

  const header = [
    `# ANTS // DOMAIN — Plan Archive Digest`,
    ``,
    `**Plans:** ${closed.length} closed · ${plans.length - closed.length} live`,
    `**Range:** ${dateRange}`,
    `**Aggregate R:** ${(totalR >= 0 ? "+" : "") + totalR.toFixed(1)}R`,
    ``,
    `---`,
    ``,
  ].join("\n");

  return header + plans.map(planToDigestMarkdown).join("\n");
}

type HorizonFilter = "all" | TradingPlan["horizon"];

function parseHorizon(v: string | null): HorizonFilter {
  return v === "intraday" || v === "swing" || v === "weekly" ? v : "all";
}

/**
 * Group plans by YYYY-MM and sort keys newest-first.
 */
function groupByMonth(
  plans: TradingPlan[]
): Array<{ ym: string; label: string; plans: TradingPlan[] }> {
  const map = new Map<string, TradingPlan[]>();
  for (const p of plans) {
    const ym = p.date.slice(0, 7); // "2026-04"
    const list = map.get(ym) ?? [];
    list.push(p);
    map.set(ym, list);
  }
  return Array.from(map.entries())
    .map(([ym, plans]) => ({
      ym,
      label: new Date(ym + "-01T00:00:00Z").toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      plans: plans.sort((a, b) => b.date.localeCompare(a.date)),
    }))
    .sort((a, b) => b.ym.localeCompare(a.ym));
}

export default function PlanArchivePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-lime">
            <span className="led lime" />
            DECODING ARCHIVE
          </div>
        </div>
      }
    >
      <PlanArchiveView />
    </Suspense>
  );
}

function parseQuery(v: string | null): string {
  return v ? v.trim() : "";
}

function PlanArchiveView() {
  const allPlans = getAllPlans();
  const latest = getLatestPlan();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [query, setQuery] = useState<string>(() =>
    parseQuery(searchParams.get("q"))
  );

  // Matches plan against query — searches thesis, risks, setup rationales,
  // and instruments. Case-insensitive, returns true for empty query.
  const matchesQuery = (p: TradingPlan, q: string): boolean => {
    if (!q) return true;
    const haystack = [
      p.id,
      p.thesis,
      ...p.risks,
      ...p.setups.flatMap((s) => [
        s.instrument,
        s.rationale,
        s.entry,
        s.stop,
        ...s.tags,
      ]),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q.toLowerCase());
  };

  const exportDigest = async () => {
    const md = archiveDigestMarkdown(plans, latest.id);
    try {
      await navigator.clipboard.writeText(md);
      toast.push({
        tone: "success",
        title: "Digest exported",
        description: `${plans.length} plan${plans.length === 1 ? "" : "s"}${horizonFilter !== "all" ? ` (${horizonFilter} filter)` : ""} · on your clipboard.`,
      });
    } catch {
      toast.push({
        tone: "error",
        title: "Export failed",
        description: "Browser denied clipboard access.",
      });
    }
  };
  const [horizonFilter, setHorizonFilterState] = useState<HorizonFilter>(
    () => parseHorizon(searchParams.get("h"))
  );

  // Sync URL whenever filter or query changes
  useEffect(() => {
    const sp = new URLSearchParams();
    if (horizonFilter !== "all") sp.set("h", horizonFilter);
    if (query) sp.set("q", query);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [horizonFilter, query, pathname, router]);

  // `s` focus shortcut is handled inside <PageSearchInput>.

  const setHorizonFilter = setHorizonFilterState;

  const plans = useMemo(() => {
    let filtered =
      horizonFilter === "all"
        ? allPlans
        : allPlans.filter((p) => p.horizon === horizonFilter);
    if (query) filtered = filtered.filter((p) => matchesQuery(p, query));
    return filtered;
    // matchesQuery is pure over (plan, q); safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPlans, horizonFilter, query]);

  const groups = useMemo(() => groupByMonth(plans), [plans]);

  // Aggregate across all closed plans IN VIEW (latest excluded since it's live).
  const closed = plans.filter((p) => p.id !== latest.id);
  const aggregateR = closed.reduce((acc, p) => {
    const o = computePlanOutcome(p);
    return o ? acc + o.totalR : acc;
  }, 0);

  // Per-horizon breakdown — always over ALL plans (so the panel doesn't
  // misleadingly disappear when you filter to one horizon).
  const allClosed = allPlans.filter((p) => p.id !== latest.id);
  const horizonR: Record<TradingPlan["horizon"], { r: number; n: number }> = {
    intraday: { r: 0, n: 0 },
    swing: { r: 0, n: 0 },
    weekly: { r: 0, n: 0 },
  };
  for (const p of allClosed) {
    const o = computePlanOutcome(p);
    if (o) {
      horizonR[p.horizon].r += o.totalR;
      horizonR[p.horizon].n += 1;
    }
  }

  // Per-month totalR for the month header strip
  const monthTotalR = (ms: TradingPlan[]) =>
    ms
      .filter((p) => p.id !== latest.id)
      .reduce((acc, p) => {
        const o = computePlanOutcome(p);
        return o ? acc + o.totalR : acc;
      }, 0);

  return (
    <div className="bg-grid-fine">
      <BackToTop />
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <DataLabel>Transmission TX-03 · Archive</DataLabel>
              <h1 className="mt-2 font-display text-5xl text-paper">
                Plan <span className="italic text-lime">Archive</span>
              </h1>
              <p className="mt-2 max-w-2xl font-display text-lg text-paper/60">
                Every trading plan the desk has shipped. Historical plans are
                kept on record so you can read the thesis alongside how it
                played out — not scrubbed when the trade closes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/app/plan/compare"
                title="Put two plans side by side"
                className="border border-ink-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
              >
                ⇌ COMPARE
              </Link>
              <button
                onClick={exportDigest}
                title="Copy archive as markdown digest"
                className="border border-ink-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
              >
                ⇩ EXPORT DIGEST
              </button>
              <Link
                href="/app/plan"
                className="border border-lime/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
              >
                ← Current plan
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* R sparkline — every closed plan as a bar, oldest → newest */}
        {allClosed.length > 0 && (
          <div className="mb-6 border border-ink-3 bg-ink-2/30 p-5">
            <div className="flex items-baseline justify-between">
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                ● R per plan · oldest → newest
              </div>
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                {allClosed.length} closed plans
              </div>
            </div>
            {(() => {
              const sortedAsc = [...allClosed].sort((a, b) =>
                a.date.localeCompare(b.date)
              );
              const rs: Array<{
                plan: TradingPlan;
                r: number;
                live: boolean;
              }> = sortedAsc.map((p) => {
                const o = computePlanOutcome(p);
                return { plan: p, r: o?.totalR ?? 0, live: false };
              });
              // Append the live (latest) plan as a placeholder bar
              rs.push({ plan: latest, r: 0, live: true });
              const maxAbs = Math.max(
                1,
                ...rs.filter((x) => !x.live).map((x) => Math.abs(x.r))
              );
              return (
                <div className="relative mt-3 h-24">
                  {/* Center zero line */}
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-paper/20" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/30">
                    0
                  </div>
                  <div className="relative flex h-full items-center gap-1 px-4">
                    {rs.map(({ plan: p, r, live }, i) => {
                      const heightPct = live
                        ? 30
                        : (Math.abs(r) / maxAbs) * 50;
                      const positive = r >= 0;
                      const isFirst = i === 0;
                      const isLast = i === rs.length - 1;
                      const tipAlign = isFirst
                        ? "left-0 translate-x-0"
                        : isLast
                        ? "right-0 left-auto translate-x-0"
                        : "left-1/2 -translate-x-1/2";
                      return (
                        <Link
                          key={p.id}
                          href={`/app/plan/${p.id}`}
                          title={
                            live
                              ? `${p.id} · ${formatDate(p.date)} · LIVE · no outcome yet`
                              : `${p.id} · ${formatDate(p.date)} · ${(r >= 0 ? "+" : "") + r.toFixed(1)}R`
                          }
                          className="group relative flex h-full flex-1 items-center"
                        >
                          {live ? (
                            // Hollow lime bar spanning both halves
                            <div className="absolute left-0 right-0 top-1/2 h-[30%] -translate-y-1/2 border-2 border-dashed border-lime/70 bg-lime/5 group-hover:bg-lime/10" />
                          ) : (
                            <div
                              className={cn(
                                "absolute left-0 right-0",
                                positive
                                  ? "bottom-1/2 bg-moss/70 group-hover:bg-moss"
                                  : "top-1/2 bg-blood/70 group-hover:bg-blood"
                              )}
                              style={{ height: `${Math.max(2, heightPct)}%` }}
                            />
                          )}
                          {/* Rich tooltip — appears above the bar, edge-clamped */}
                          <div
                            className={cn(
                              "absolute z-20 whitespace-nowrap border bg-ink-2 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 opacity-0 shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-opacity group-hover:opacity-100",
                              tipAlign,
                              live
                                ? "border-lime/60 text-lime"
                                : positive
                                ? "border-moss/60 text-moss"
                                : "border-blood/60 text-[#fda4af]",
                              "bottom-full mb-1"
                            )}
                          >
                            <div className="text-[8px] text-paper/50">
                              {p.id} · {formatDate(p.date)}
                            </div>
                            <div className="font-display text-sm not-italic leading-none">
                              {live
                                ? "LIVE"
                                : (r >= 0 ? "+" : "") + r.toFixed(1) + "R"}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            <div className="mt-2 flex items-baseline justify-between font-mono text-[9px] uppercase tracking-widest2 text-paper/30">
              <span>{formatDate([...allClosed].sort((a, b) => a.date.localeCompare(b.date))[0].date)}</span>
              <span className="text-paper/40">hover for R · dashed = live</span>
              <span className="text-lime">{formatDate(latest.date)}</span>
            </div>
          </div>
        )}

        {/* Aggregate stats strip */}
        <div className="mb-6 grid grid-cols-1 gap-px bg-ink-3 sm:grid-cols-4">
          <div className="bg-ink p-5">
            <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
              Plans on record
            </div>
            <div className="mt-1 font-display text-3xl text-paper">
              {plans.length}
            </div>
          </div>
          <div className="bg-ink p-5">
            <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
              Latest
            </div>
            <div className="mt-1 font-display text-3xl text-lime">
              {latest.id.replace(/^TP-/, "")}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
              {formatDate(latest.date)}
            </div>
          </div>
          <div className="bg-ink p-5">
            <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
              Closed plans
            </div>
            <div className="mt-1 font-display text-3xl text-paper">
              {closed.length}
            </div>
          </div>
          <div className="bg-ink p-5">
            <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
              Aggregate R · closed
            </div>
            <div
              className={
                "mt-1 font-display text-3xl " +
                (aggregateR > 0
                  ? "text-moss"
                  : aggregateR < 0
                  ? "text-blood"
                  : "text-paper")
              }
            >
              {(aggregateR >= 0 ? "+" : "") + aggregateR.toFixed(1)}R
            </div>
          </div>
        </div>

        {/* Search input */}
        <div className="mb-6">
          <PageSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search thesis, setups, instruments, tags…   (press s to focus, esc to blur)"
            ariaLabel="Search archive"
            matchLabel={
              query
                ? `${plans.length} ${plans.length === 1 ? "MATCH" : "MATCHES"} for "${query}"`
                : null
            }
          />
        </div>

        {/* Horizon breakdown — clickable cells that act as filter chips */}
        <div className="mb-10 border border-ink-3 bg-ink-2/30 p-5">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
              ● Edge by horizon · click to filter
            </div>
            {horizonFilter !== "all" && (
              <button
                onClick={() => setHorizonFilter("all")}
                className="border border-ink-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
              >
                ✕ Clear
              </button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-px bg-ink-3 sm:grid-cols-4">
            <button
              onClick={() => setHorizonFilter("all")}
              className={cn(
                "bg-ink p-4 text-left transition-colors",
                horizonFilter === "all"
                  ? "border-l-2 border-lime bg-ink-2"
                  : "hover:bg-ink-2"
              )}
            >
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
                ALL
              </div>
              <div
                className={
                  "mt-1 font-display text-2xl " +
                  (allClosed.length === 0
                    ? "text-paper/30"
                    : aggregateR > 0
                    ? "text-moss"
                    : aggregateR < 0
                    ? "text-blood"
                    : "text-paper/70")
                }
              >
                {allClosed.length === 0
                  ? "—"
                  : (aggregateR >= 0 ? "+" : "") + aggregateR.toFixed(1) + "R"}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                {allClosed.length} closed
              </div>
            </button>
            {(["intraday", "swing", "weekly"] as const).map((h) => {
              const data = horizonR[h];
              const noData = data.n === 0;
              return (
                <button
                  key={h}
                  onClick={() => setHorizonFilter(h)}
                  disabled={noData}
                  className={cn(
                    "bg-ink p-4 text-left transition-colors",
                    horizonFilter === h
                      ? "border-l-2 border-lime bg-ink-2"
                      : noData
                      ? "cursor-default opacity-60"
                      : "hover:bg-ink-2"
                  )}
                >
                  <div className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
                    {h}
                  </div>
                  <div
                    className={
                      "mt-1 font-display text-2xl " +
                      (noData
                        ? "text-paper/30"
                        : data.r > 0
                        ? "text-moss"
                        : data.r < 0
                        ? "text-blood"
                        : "text-paper/70")
                    }
                  >
                    {noData
                      ? "—"
                      : (data.r >= 0 ? "+" : "") + data.r.toFixed(1) + "R"}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                    {data.n} {data.n === 1 ? "plan" : "plans"}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-widest2 text-paper/30">
            ● Sample size matters more than the number itself. With {allClosed.length}{" "}
            closed plan{allClosed.length === 1 ? "" : "s"}, this is signal direction, not edge.
          </p>
        </div>

        <SectionNumber
          n="—"
          label={
            horizonFilter === "all"
              ? `${plans.length} PLANS · ${groups.length} ${groups.length === 1 ? "MONTH" : "MONTHS"}`
              : `${plans.length} ${horizonFilter.toUpperCase()} PLAN${plans.length === 1 ? "" : "S"}`
          }
        />

        {plans.length === 0 && (
          <div className="mt-6 border border-ink-3 bg-ink-2/40 p-12 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood">
              ● NULL TRANSMISSION
            </div>
            <div className="mt-3 font-display text-2xl text-paper">
              No {horizonFilter} plans on record.
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              The desk hasn't shipped a {horizonFilter} plan yet — or this
              horizon was filtered to an empty set.
            </div>
            <button
              onClick={() => setHorizonFilter("all")}
              className="mt-6 border border-lime/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
            >
              ✕ Show all plans
            </button>
          </div>
        )}

        <div className="mt-6 space-y-10">
          {groups.map((group) => {
            const mR = monthTotalR(group.plans);
            const closedInMonth = group.plans.filter((p) => p.id !== latest.id).length;
            return (
              <section key={group.ym}>
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-lime/30 pb-2">
                  <div className="flex items-baseline gap-3">
                    <div className="font-display text-3xl italic text-lime">
                      {group.label}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                      · {group.plans.length} {group.plans.length === 1 ? "plan" : "plans"}
                    </div>
                  </div>
                  {closedInMonth > 0 && (
                    <div className="flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
                      <span>Month R ·</span>
                      <span
                        className={
                          "font-display text-xl " +
                          (mR > 0
                            ? "text-moss"
                            : mR < 0
                            ? "text-blood"
                            : "text-paper/70")
                        }
                      >
                        {(mR >= 0 ? "+" : "") + mR.toFixed(1)}R
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-px bg-ink-3">
                  {group.plans.map((p) => {
                    const isLatest = p.id === latest.id;
                    const longs = p.setups.filter((s) => s.direction === "long").length;
                    const shorts = p.setups.filter((s) => s.direction === "short").length;
                    const outcome = computePlanOutcome(p);

                    return (
                      <Link
                        key={p.id}
                        href={`/app/plan/${p.id}`}
                        className="group grid grid-cols-12 gap-6 bg-ink p-6 transition-colors hover:bg-ink-2"
                      >
                {/* Meta column */}
                <div className="col-span-12 lg:col-span-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                      <Highlight text={p.id} query={query} />
                    </span>
                    {isLatest && (
                      <span className="border border-lime bg-lime/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest2 text-lime">
                        ● LATEST
                      </span>
                    )}
                  </div>
                  <div className="mt-2 font-display text-2xl text-paper">
                    {formatDate(p.date)}
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                    {p.horizon} · by {p.authoredBy}
                  </div>
                  <div className="mt-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2">
                    <span className="text-moss">
                      ▲ {longs} long
                    </span>
                    <span className="text-paper/30">·</span>
                    <span className="text-lime">
                      ▼ {shorts} short
                    </span>
                  </div>
                  {outcome && !isLatest && (
                    <div className="mt-3 flex items-baseline gap-3 border-t border-ink-3 pt-3">
                      <div
                        className={
                          "font-display text-2xl " +
                          (outcome.totalR > 0
                            ? "text-moss"
                            : outcome.totalR < 0
                            ? "text-blood"
                            : "text-paper/70")
                        }
                      >
                        {outcome.totalRLabel}
                      </div>
                      <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                        {outcome.wins}W · {outcome.losses}L
                        {outcome.flat > 0 && ` · ${outcome.flat}F`}
                        {outcome.skipped > 0 && ` · ${outcome.skipped}S`}
                      </div>
                    </div>
                  )}
                  {isLatest && (
                    <div className="mt-3 border-t border-ink-3 pt-3 font-mono text-[10px] uppercase tracking-widest2 text-lime">
                      ● LIVE · no outcome yet
                    </div>
                  )}
                </div>

                        {/* Thesis column */}
                        <div className="col-span-12 lg:col-span-9">
                          <p
                            className="line-clamp-3 font-display text-lg leading-relaxed text-paper/85 transition-colors group-hover:text-paper"
                            title={p.thesis}
                          >
                            <Highlight text={p.thesis} query={query} />
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {p.setups.map((s) => (
                              <span
                                key={s.id}
                                className={
                                  "border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 " +
                                  (s.direction === "long"
                                    ? "border-moss/50 text-moss"
                                    : "border-lime/50 text-lime")
                                }
                              >
                                {s.direction === "long" ? "▲" : "▼"}{" "}
                                <Highlight
                                  text={s.instrument}
                                  query={query}
                                />
                              </span>
                            ))}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 border border-ink-3 bg-ink-2/30 p-5 font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
          ● Plan archive is read-only. Historical plans are never edited after
          publication. If a plan closed outside its stated invalidation, the
          next plan's risks section cites it by ID.
        </div>
      </div>
    </div>
  );
}
