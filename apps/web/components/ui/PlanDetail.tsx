"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppState, isPaid } from "@/lib/state";
import { useToast } from "@/lib/toast";
import { DataLabel, SectionNumber, BiasBadge, ImpactPill } from "@/components/ui/Marker";
import { PaywallOverlay } from "@/components/ui/Paywall";
import { WatchPin } from "@/components/ui/WatchPin";
import { formatDate, formatTime } from "@/lib/cn";
import { computePlanOutcome } from "@/lib/mock/plans";
import { news } from "@/lib/mock/news";
import type { TradingPlan, SetupOutcome, TradingSetup } from "@/lib/mock/types";

function setupToText(s: TradingSetup, planId: string): string {
  const lines = [
    `${planId} · ${s.id} · ${s.instrument} · ${s.direction.toUpperCase()}`,
    `Entry:        ${s.entry}`,
    `Stop:         ${s.stop}`,
    `Targets:      ${s.targets.map((t, i) => `T${i + 1} ${t}`).join("  ·  ")}`,
    `Invalidation: ${s.invalidation}`,
    ``,
    `Rationale: ${s.rationale}`,
    ``,
    `— ANTS // DOMAIN`,
  ];
  return lines.join("\n");
}

function planToMarkdown(plan: TradingPlan): string {
  const lines: string[] = [
    `# Trading Plan · ${plan.id}`,
    ``,
    `**Date:** ${formatDate(plan.date)}  `,
    `**Horizon:** ${plan.horizon}  `,
    `**Author:** ${plan.authoredBy}`,
    ``,
    `## Thesis`,
    ``,
    plan.thesis,
    ``,
    `## Setups`,
    ``,
  ];

  for (const s of plan.setups) {
    lines.push(`### ${s.id} · ${s.instrument} · ${s.direction.toUpperCase()}`);
    lines.push("");
    lines.push(`- **Entry:** ${s.entry}`);
    lines.push(`- **Stop:** ${s.stop}`);
    lines.push(
      `- **Targets:** ${s.targets.map((t, i) => `T${i + 1} ${t}`).join(", ")}`
    );
    lines.push(`- **Invalidation:** ${s.invalidation}`);
    lines.push(`- **Confidence:** ${s.confidence} / 5`);
    if (s.tags.length > 0) {
      lines.push(`- **Tags:** ${s.tags.map((t) => `#${t}`).join(", ")}`);
    }
    lines.push("");
    lines.push(`**Rationale:** ${s.rationale}`);
    if (s.outcome && s.outcome !== "live" && s.outcome !== "open") {
      lines.push("");
      lines.push(
        `**Outcome:** ${s.outcome.toUpperCase()}${s.outcomeR ? ` · ${s.outcomeR}` : ""}`
      );
      if (s.outcomeNotes) lines.push(`> ${s.outcomeNotes}`);
    }
    lines.push("");
  }

  if (plan.risks.length > 0) {
    lines.push(`## Risks`);
    lines.push("");
    for (let i = 0; i < plan.risks.length; i++) {
      lines.push(`${i + 1}. ${plan.risks[i]}`);
    }
    lines.push("");
  }

  lines.push(`---`);
  lines.push(`*Generated from ANTS // DOMAIN · ${plan.id}*`);

  return lines.join("\n");
}

const OUTCOME_META: Record<
  SetupOutcome,
  { label: string; style: string; dot: string }
> = {
  live: {
    label: "LIVE",
    style: "border-lime text-lime bg-lime/10",
    dot: "bg-lime",
  },
  open: {
    label: "OPEN",
    style: "border-lime/70 text-lime bg-lime/5",
    dot: "bg-lime/70",
  },
  win: {
    label: "WIN",
    style: "border-moss text-moss bg-moss/10",
    dot: "bg-moss",
  },
  loss: {
    label: "LOSS",
    style: "border-blood text-[#fda4af] bg-blood/15",
    dot: "bg-blood",
  },
  stopped: {
    label: "STOPPED",
    style: "border-blood/70 text-[#fda4af] bg-blood/10",
    dot: "bg-blood/80",
  },
  invalidated: {
    label: "FLAT",
    style: "border-paper/30 text-paper/70 bg-paper/5",
    dot: "bg-paper/40",
  },
  skipped: {
    label: "SKIPPED",
    style: "border-paper/20 text-paper/40 bg-transparent",
    dot: "bg-paper/20",
  },
};

/**
 * Shared renderer for a single trading plan. Used by /app/plan (latest),
 * /app/plan/[id] (archive detail), and anywhere else a plan needs to show
 * with paywall gating, thesis, setups, and risks.
 */
export function PlanDetail({
  plan,
  headerExtra,
  isLatest,
  breadcrumbs,
}: {
  plan: TradingPlan;
  headerExtra?: React.ReactNode;
  isLatest?: boolean;
  breadcrumbs?: React.ReactNode;
}) {
  const { tier } = useAppState();
  const paid = isPaid(tier);
  const toast = useToast();
  const outcome = computePlanOutcome(plan);

  // News items that directly cite this plan via relatedPlanIds
  const informingNews = news.filter((n) =>
    n.relatedPlanIds?.includes(plan.id)
  );

  const copySetup = async (s: TradingSetup) => {
    const text = setupToText(s, plan.id);
    try {
      await navigator.clipboard.writeText(text);
      toast.push({
        tone: "success",
        title: "Setup copied",
        description: `${s.id} · ${s.instrument} ${s.direction} · ready to paste`,
        duration: 2500,
      });
    } catch {
      toast.push({
        tone: "error",
        title: "Copy failed",
        description:
          "Browser denied clipboard access. Try selecting the text manually.",
      });
    }
  };

  const exportPlanMarkdown = async () => {
    const md = planToMarkdown(plan);
    try {
      await navigator.clipboard.writeText(md);
      toast.push({
        tone: "success",
        title: "Plan exported",
        description: `${plan.id} · ${plan.setups.length} setups · markdown on your clipboard, paste anywhere.`,
      });
    } catch {
      toast.push({
        tone: "error",
        title: "Export failed",
        description: "Browser denied clipboard access.",
      });
    }
  };

  const copySetupLink = async (s: TradingSetup) => {
    const url = `${window.location.origin}/app/plan/${plan.id}#${s.id}`;
    try {
      await navigator.clipboard.writeText(url);
      // Push the hash into browser history so back/forward navigates
      // between anchored setups. Use pushState (not replaceState) so each
      // copied anchor becomes a real history entry.
      if (window.location.hash !== `#${s.id}`) {
        window.history.pushState(null, "", `#${s.id}`);
      }
      toast.push({
        tone: "success",
        title: "Link copied",
        description: `${plan.id}#${s.id} · shareable deep link`,
        duration: 2500,
      });
    } catch {
      toast.push({
        tone: "error",
        title: "Copy failed",
        description: "Browser denied clipboard access.",
      });
    }
  };

  // Scroll to hash on mount and on popstate (back/forward navigation)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const scrollToHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;
      // Defer until after paint so the element is mounted and positioned
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add(
            "ring-2",
            "ring-lime",
            "ring-offset-2",
            "ring-offset-ink"
          );
          setTimeout(() => {
            el.classList.remove(
              "ring-2",
              "ring-lime",
              "ring-offset-2",
              "ring-offset-ink"
            );
          }, 2400);
        }
      }, 200);
    };

    scrollToHash();
    window.addEventListener("popstate", scrollToHash);
    return () => window.removeEventListener("popstate", scrollToHash);
  }, [plan.id]);

  return (
    <div className="bg-grid-fine">
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          {breadcrumbs && <div className="mb-4">{breadcrumbs}</div>}
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <DataLabel>Transmission TX-03 · Restricted</DataLabel>
                {isLatest && (
                  <span className="border border-lime bg-lime/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-lime">
                    ● LATEST
                  </span>
                )}
                {!isLatest && (
                  <span className="border border-ink-3 bg-ink px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/50">
                    ARCHIVE
                  </span>
                )}
              </div>
              <h1 className="mt-2 font-display text-5xl text-paper">
                Trading <span className="italic text-lime">Plan</span>
              </h1>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-widest2 text-paper/40">
                Plan ID{" "}
                <span className="text-paper">{plan.id}</span> ·{" "}
                {formatDate(plan.date)} · Authored by{" "}
                <span className="text-paper">{plan.authoredBy}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="font-mono text-[10px] uppercase tracking-widest2">
                <div className={paid ? "text-moss" : "text-blood"}>
                  ● {paid ? "ACCESS GRANTED" : "ACCESS DENIED"}
                </div>
                <div className="text-paper/40">Horizon · {plan.horizon}</div>
              </div>
              <div className="flex items-center gap-2">
                {paid && (
                  <button
                    onClick={exportPlanMarkdown}
                    title="Copy this plan as markdown to your clipboard"
                    className="border border-ink-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
                  >
                    ⇩ EXPORT MD
                  </button>
                )}
                {headerExtra}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-10">
        {!paid && (
          <PaywallOverlay
            surface="Trading Plan"
            reason="The daily / weekly directional plan is restricted to VIP+ Trader. Upgrade to read the thesis, the setups, and the invalidation levels."
          />
        )}

        <div
          className={!paid ? "pointer-events-none select-none blur-sm" : ""}
        >
          {/* Thesis */}
          <section>
            <SectionNumber n="01 /" label="DIRECTIONAL THESIS" />
            <div className="mt-4 border-l-4 border-lime bg-ink-2/40 p-6">
              <p className="font-display text-xl leading-relaxed text-paper">
                {plan.thesis}
              </p>
            </div>
          </section>

          {/* Plan outcome summary — only for archived plans with closed setups */}
          {outcome && !isLatest && (
            <section className="mt-8 border border-ink-3 bg-ink-2/40 p-5">
              <DataLabel>Plan outcome</DataLabel>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                    Total R
                  </div>
                  <div
                    className={
                      "font-display text-4xl " +
                      (outcome.totalR > 0
                        ? "text-moss"
                        : outcome.totalR < 0
                        ? "text-blood"
                        : "text-paper/70")
                    }
                  >
                    {outcome.totalRLabel}
                  </div>
                </div>
                <OutcomeStat label="Wins" value={outcome.wins} tone="moss" />
                <OutcomeStat
                  label="Losses"
                  value={outcome.losses}
                  tone="blood"
                />
                {outcome.flat > 0 && (
                  <OutcomeStat
                    label="Flat"
                    value={outcome.flat}
                    tone="muted"
                  />
                )}
                {outcome.skipped > 0 && (
                  <OutcomeStat
                    label="Skipped"
                    value={outcome.skipped}
                    tone="muted"
                  />
                )}
                <div className="ml-auto font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                  {outcome.closed} / {plan.setups.length} setups closed
                </div>
              </div>
            </section>
          )}

          {/* Setups */}
          <section className="mt-12">
            <SectionNumber
              n="02 /"
              label={`SETUPS · ${plan.setups.length} ${isLatest ? "LIVE" : "ON RECORD"}`}
            />
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {plan.setups.map((s) => {
                const status = s.outcome ?? (isLatest ? "live" : "open");
                const meta = OUTCOME_META[status];
                return (
                <div
                  key={s.id}
                  id={s.id}
                  className="group/setup relative scroll-mt-24 border border-ink-3 bg-ink-2/30 p-5 transition-all hover:border-lime/40"
                >
                  <div className="absolute right-3 top-3 z-10 flex gap-1 opacity-0 transition-opacity group-hover/setup:opacity-100">
                    <button
                      onClick={() => copySetupLink(s)}
                      title={`Copy deep link to ${s.id}`}
                      aria-label={`Copy link to setup ${s.id}`}
                      className="border border-ink-3 bg-ink-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/40 hover:border-lime hover:text-lime"
                    >
                      ⌯ LINK
                    </button>
                    <button
                      onClick={() => copySetup(s)}
                      title={`Copy ${s.id} as text`}
                      aria-label={`Copy setup ${s.id} text`}
                      className="border border-ink-3 bg-ink-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/40 hover:border-lime hover:text-lime"
                    >
                      ⧉ TEXT
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                      {s.id}
                    </span>
                    <div className="flex items-center gap-2 pr-24">
                      <span
                        className={
                          "inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 " +
                          meta.style
                        }
                      >
                        <span className={`h-1.5 w-1.5 ${meta.dot}`} />
                        {meta.label}
                        {s.outcomeR && status !== "skipped" && (
                          <span className="ml-1">· {s.outcomeR}</span>
                        )}
                      </span>
                      <BiasBadge bias={s.bias} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-3">
                    <h3 className="font-display text-3xl text-paper">
                      {s.instrument}
                    </h3>
                    <WatchPin ticker={s.instrument} size="md" />
                    <span
                      className={
                        "font-mono text-sm uppercase tracking-widest2 " +
                        (s.direction === "long" ? "text-moss" : "text-lime")
                      }
                    >
                      {s.direction}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Field label="Entry">{s.entry}</Field>
                    <Field label="Stop" highlight>
                      {s.stop}
                    </Field>
                    <Field label="Targets">
                      <ol className="space-y-0.5">
                        {s.targets.map((t, i) => (
                          <li key={t} className="font-mono text-paper">
                            T{i + 1} · {t}
                          </li>
                        ))}
                      </ol>
                    </Field>
                  </div>

                  <div className="mt-4 border-t border-ink-3 pt-3">
                    <DataLabel>Rationale</DataLabel>
                    <p className="mt-1 text-sm text-paper/70">
                      {s.rationale}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-blood/40 pt-3">
                    <div className="font-mono text-[9px] uppercase tracking-widest2 text-blood">
                      Invalidation
                    </div>
                    <p className="mt-1 text-sm text-paper/80">
                      {s.invalidation}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <DataLabel>Confidence</DataLabel>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          className={
                            "h-2 w-4 " +
                            (i <= s.confidence ? "bg-lime" : "bg-ink-3")
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {s.outcomeNotes && (
                    <div className="mt-4 border-t border-ink-3 pt-3">
                      <div
                        className={
                          "font-mono text-[9px] uppercase tracking-widest2 " +
                          (status === "win"
                            ? "text-moss"
                            : status === "loss" || status === "stopped"
                            ? "text-blood"
                            : "text-paper/60")
                        }
                      >
                        Outcome · {meta.label}
                      </div>
                      <p className="mt-1 text-sm text-paper/80">
                        {s.outcomeNotes}
                      </p>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </section>

          {/* Informed by — news articles that cite this plan */}
          {informingNews.length > 0 && (
            <section className="mt-12">
              <SectionNumber
                n="03 /"
                label={`INFORMED BY · ${informingNews.length} NEWS ITEM${informingNews.length === 1 ? "" : "S"}`}
              />
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                News the desk flagged as directly shaping this plan's thesis.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-px bg-ink-3 md:grid-cols-2">
                {informingNews.map((n) => (
                  <Link
                    key={n.id}
                    href={`/app/news/${n.id}`}
                    className="group block bg-ink p-5 transition-colors hover:bg-ink-2"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                        {n.id}
                      </span>
                      <ImpactPill level={n.impact} />
                      <span className="ml-auto font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                        {formatTime(n.ts)}Z · BY {n.author.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-xl leading-snug text-paper transition-colors group-hover:text-lime">
                      {n.headline}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-paper/60">
                      {n.analysis}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Risks */}
          <section className="mt-12">
            <SectionNumber
              n={informingNews.length > 0 ? "04 /" : "03 /"}
              label="RISKS"
            />
            <ul className="mt-4 space-y-2">
              {plan.risks.map((r, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 border-l-2 border-blood/60 bg-blood/5 p-4"
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest2 text-blood">
                    R0{i + 1}
                  </span>
                  <span className="text-sm text-paper/80">{r}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-12 border-t border-ink-3 pt-6 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
            Plan revision · v1 · Authored {formatDate(plan.date)} by{" "}
            {plan.authoredBy} · Reviewed by Desk · Distributed via DOMAIN /
            Telegram
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "border-l-2 pl-3 " +
        (highlight ? "border-blood" : "border-paper/20")
      }
    >
      <DataLabel>{label}</DataLabel>
      <div className="font-mono text-paper">{children}</div>
    </div>
  );
}

function OutcomeStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "moss" | "blood" | "muted";
}) {
  const color =
    tone === "moss"
      ? "text-moss"
      : tone === "blood"
      ? "text-blood"
      : "text-paper/60";
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
        {label}
      </div>
      <div className={`font-display text-2xl ${color}`}>{value}</div>
    </div>
  );
}
