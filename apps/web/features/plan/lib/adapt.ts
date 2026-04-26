import { HASHTAGS, type Hashtag } from "@tradevantage/shared";
import type { Plan } from "@/features/plan/types";
import { logger } from "@/lib/logger";
import type { TradingPlan, TradingSetup, Bias } from "@/features/plan/types";

const KNOWN_HASHTAGS = new Set<string>(HASHTAGS);

function narrowHashtags(tags: readonly unknown[]): Hashtag[] {
  return tags.filter(
    (t): t is Hashtag => typeof t === "string" && KNOWN_HASHTAGS.has(t),
  );
}

function parseHorizon(tags: string[]): TradingPlan["horizon"] {
  for (const tag of tags) {
    if (tag === "horizon:intraday") return "intraday";
    if (tag === "horizon:swing") return "swing";
    if (tag === "horizon:weekly") return "weekly";
  }
  return "swing";
}

function mapDirectionToBias(direction: Plan["direction"]): Bias {
  return direction === "long" ? "bullish" : "bearish";
}

type RichSetupCandidate = {
  id?: unknown;
  instrument?: unknown;
  direction?: unknown;
  bias?: unknown;
  entry?: unknown;
  stop?: unknown;
  targets?: unknown;
  invalidation?: unknown;
  rationale?: unknown;
  confidence?: unknown;
  tags?: unknown;
  outcome?: unknown;
  outcomeNotes?: unknown;
  outcomeR?: unknown;
};

function tryRichSetup(
  raw: RichSetupCandidate,
  fallbackId: string,
): TradingSetup | null {
  const { instrument, direction, entry, stop, targets } = raw;
  if (
    typeof instrument !== "string" ||
    (direction !== "long" && direction !== "short") ||
    typeof entry !== "string" ||
    typeof stop !== "string" ||
    !Array.isArray(targets)
  ) {
    return null;
  }
  const targetStrs = targets.filter((t): t is string => typeof t === "string");
  const biasCandidate =
    raw.bias === "bullish" || raw.bias === "bearish" || raw.bias === "neutral"
      ? (raw.bias as Bias)
      : mapDirectionToBias(direction);
  const conf =
    typeof raw.confidence === "number" &&
    raw.confidence >= 1 &&
    raw.confidence <= 5
      ? (raw.confidence as 1 | 2 | 3 | 4 | 5)
      : 3;
  const tags = Array.isArray(raw.tags) ? narrowHashtags(raw.tags) : [];
  const setup: TradingSetup = {
    id: typeof raw.id === "string" ? raw.id : fallbackId,
    instrument,
    direction,
    bias: biasCandidate,
    entry,
    stop,
    targets: targetStrs,
    invalidation:
      typeof raw.invalidation === "string" ? raw.invalidation : "",
    rationale: typeof raw.rationale === "string" ? raw.rationale : "",
    confidence: conf,
    tags,
  };
  if (typeof raw.outcome === "string") {
    const o = raw.outcome;
    if (
      o === "live" ||
      o === "open" ||
      o === "win" ||
      o === "loss" ||
      o === "stopped" ||
      o === "invalidated" ||
      o === "skipped"
    ) {
      setup.outcome = o;
    }
  }
  if (typeof raw.outcomeNotes === "string") setup.outcomeNotes = raw.outcomeNotes;
  if (typeof raw.outcomeR === "string") setup.outcomeR = raw.outcomeR;
  return setup;
}

function synthesizeSetup(plan: Plan): TradingSetup {
  return {
    id: "S-01",
    instrument: plan.symbol,
    direction: plan.direction,
    bias: mapDirectionToBias(plan.direction),
    entry: plan.entry != null ? String(plan.entry) : "",
    stop: plan.stop != null ? String(plan.stop) : "",
    targets: plan.target != null ? [String(plan.target)] : [],
    invalidation: "",
    rationale: plan.thesis.slice(0, 200),
    confidence: 3,
    tags: narrowHashtags(plan.tags),
  };
}

type RisksMeta = { label: "__risks__"; items: string[] };

function extractRisks(setups: Plan["setups"]): string[] {
  for (const s of setups) {
    if (
      (s as Partial<RisksMeta>).label === "__risks__" &&
      Array.isArray((s as Partial<RisksMeta>).items)
    ) {
      return (s as RisksMeta).items.filter(
        (v): v is string => typeof v === "string",
      );
    }
  }
  return [];
}

export function dbPlanToTradingPlan(plan: Plan): TradingPlan {
  const horizon = parseHorizon(plan.tags);

  const rawSetups = plan.setups.filter(
    (s) => (s as Partial<RisksMeta>).label !== "__risks__",
  );
  const richAttempts: TradingSetup[] = [];
  for (let i = 0; i < rawSetups.length; i++) {
    try {
      const s = tryRichSetup(
        rawSetups[i] as RichSetupCandidate,
        `S-${String(i + 1).padStart(2, "0")}`,
      );
      if (s) richAttempts.push(s);
    } catch (error) {
      logger.warn("plan.adapt: malformed setup JSONB", {
        planId: plan.id,
        setupIndex: i,
        error,
        scope: "plan.adapt",
      });
    }
  }

  const setups =
    richAttempts.length > 0 ? richAttempts : [synthesizeSetup(plan)];

  const risks = extractRisks(plan.setups);

  const date = plan.published_at ?? plan.created_at;
  const isoDate = date.length >= 10 ? date.slice(0, 10) : date;

  return {
    id: plan.id,
    date: isoDate,
    horizon,
    thesis: plan.thesis,
    setups,
    risks,
    authoredBy: "Desk",
  };
}
