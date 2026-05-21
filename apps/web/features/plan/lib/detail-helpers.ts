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
    `— ANTS // DOMAIN`,
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
  lines.push(`*Generated from ANTS // DOMAIN · ${plan.id}*`);

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

type OutcomeMeta = {
  label: string;
  style: string;
  dot: string;
};

export const OUTCOME_META: Record<SetupOutcome, OutcomeMeta> = {
  live: {
    label: "LIVE",
    style: "border-brand text-brand bg-brand/10",
    dot: "bg-brand",
  },
  open: {
    label: "OPEN",
    style: "border-brand/70 text-brand bg-brand/5",
    dot: "bg-brand/70",
  },
  win: {
    label: "WIN",
    style: "border-moss text-moss bg-moss/10",
    dot: "bg-moss",
  },
  loss: {
    label: "LOSS",
    style: "border-blood text-blood-text bg-blood/15",
    dot: "bg-blood",
  },
  stopped: {
    label: "STOPPED",
    style: "border-blood/70 text-blood-text bg-blood/10",
    dot: "bg-blood/80",
  },
  invalidated: {
    label: "FLAT",
    style: "border-white/30 text-white/70 bg-white/5",
    dot: "bg-white/40",
  },
  skipped: {
    label: "SKIPPED",
    style: "border-white/20 text-white/40 bg-transparent",
    dot: "bg-white/20",
  },
};
