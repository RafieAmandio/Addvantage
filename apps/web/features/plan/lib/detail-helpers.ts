import type { SetupOutcome, TradingPlan, TradingSetup } from "@/features/plan/types";
import { formatDate } from "@/lib/cn";

export function setupToText(s: TradingSetup, planId: string): string {
  const lines = [
    `${planId} · ${s.id} · ${s.instrument} · ${s.direction.toUpperCase()}`,
    `Entry:        ${s.entry}`,
    `Stop:         ${s.stop}`,
    `Targets:      ${s.targets.map((t, i) => `T${i + 1} ${t}`).join("  ·  ")}`,
    `Invalidation: ${s.invalidation}`,
    ``,
    `Rationale: ${s.rationale}`,
    ``,
    `— TradeVantage`,
  ];
  return lines.join("\n");
}

export function planToMarkdown(plan: TradingPlan): string {
  const lines: string[] = [
    `# Trading Plan · ${plan.id}`,
    ``,
    `**Date:** ${formatDate(plan.date)}  `,
    `**Horizon:** ${plan.horizon}  `,
    `**Bias:** ${plan.bias}  `,
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
    if (s.imageUrl) {
      lines.push(`- **Chart:** ${s.imageUrl}`);
    }
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
  lines.push(`*Generated from TradeVantage · ${plan.id}*`);

  return lines.join("\n");
}

export interface PlanOutcomeDigest {
  closed: number;
  wins: number;
  losses: number;
  flat: number;
  skipped: number;
  totalR: number;
  totalRLabel: string;
}

export function computePlanOutcome(plan: TradingPlan): PlanOutcomeDigest | null {
  const closed = plan.setups.filter(
    (s) => s.outcome && s.outcome !== "live" && s.outcome !== "open"
  );
  if (closed.length === 0) return null;

  const wins = closed.filter((s) => s.outcome === "win").length;
  const losses = closed.filter(
    (s) => s.outcome === "loss" || s.outcome === "stopped"
  ).length;
  const flat = closed.filter((s) => s.outcome === "invalidated").length;
  const skipped = closed.filter((s) => s.outcome === "skipped").length;

  const totalR = closed.reduce((acc, s) => {
    if (!s.outcomeR) return acc;
    const n = parseFloat(s.outcomeR.replace(/R/i, ""));
    return isFinite(n) ? acc + n : acc;
  }, 0);

  return {
    closed: closed.length,
    wins,
    losses,
    flat,
    skipped,
    totalR,
    totalRLabel: (totalR >= 0 ? "+" : "") + totalR.toFixed(1) + "R",
  };
}

/** Text colour for an R figure: up green, down red, flat muted. */
export function rTone(r: number | null | undefined): string {
  if (r == null || r === 0) return "text-white/55";
  return r > 0 ? "text-up" : "text-down";
}

type OutcomeMeta = {
  label: string;
  /** Text colour class for the status word. */
  tone: string;
};

export const OUTCOME_META: Record<SetupOutcome, OutcomeMeta> = {
  live: { label: "Live", tone: "text-brand" },
  open: { label: "Open", tone: "text-brand" },
  win: { label: "Win", tone: "text-up" },
  loss: { label: "Loss", tone: "text-down" },
  stopped: { label: "Stopped", tone: "text-down" },
  invalidated: { label: "Flat", tone: "text-white/55" },
  skipped: { label: "Skipped", tone: "text-white/30" },
};

/** "5,232 — 5,248 zone" -> { figure: "5,232-5,248", note: "zone" }. Free-text levels stay readable. */
export function splitLevel(raw: string): { figure: string; note: string } {
  const m = raw.trim().match(/^([\d.,]+(?:\s*[—–-]\s*[\d.,]+)?)\s*(.*)$/);
  if (!m) return { figure: "", note: raw.trim() };
  return { figure: m[1].replace(/\s*[—–-]\s*/, "-"), note: m[2].replace(/^\((.*)\)$/, "$1") };
}

/** Midpoint of the first one or two numbers in a level string, or null. */
export function levelNumber(raw: string): number | null {
  const nums = (raw.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).slice(0, 2).map((n) => parseFloat(n.replace(/,/g, "")));
  const { figure } = splitLevel(raw);
  if (!figure || nums.length === 0) return null;
  return figure.includes("-") && nums.length === 2 ? (nums[0] + nums[1]) / 2 : nums[0];
}

/** Reward to first target over risk to stop, from the setup's own levels. */
export function riskReward(s: TradingSetup): string | null {
  const e = levelNumber(s.entry);
  const st = levelNumber(s.stop);
  const t = s.targets[0] ? levelNumber(s.targets[0]) : null;
  if (e == null || st == null || t == null || e === st) return null;
  const rr = Math.abs(t - e) / Math.abs(e - st);
  return isFinite(rr) ? `1:${rr.toFixed(2)}` : null;
}
