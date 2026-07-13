import { ai } from "../lib/ai";
import { logger } from "../lib/logger";
import { retry } from "../lib/retry";
import {
  HASHTAGS,
  BIAS_LEVELS,
  IMPACT_LEVELS,
  RephraseOutputSchema,
  type RephraseOutput,
} from "@tradevantage/shared";

const SYSTEM_PROMPT = `You are the editorial desk at TradeVantage. You rewrite raw market research into punchy, trader-facing recaps.

RULES:
- Never credit the wire source in the text. The editorial byline is the source code ([FRED], [SC], etc.). Write as if the desk produced the analysis.
- Headline: under 120 chars, punchy, no filler.
- "rephrased" MUST be exactly 3 short paragraphs separated by \\n\\n:
  Paragraph 1 — THE SETUP: What's the backdrop? Give the macro context or why this matters right now. Ground the reader in 2–3 sentences.
  Paragraph 2 — WHAT HAPPENED: The actual data, event, or development. Be specific — numbers, dates, comparisons to prior. 2–3 sentences.
  Paragraph 3 — SO WHAT: The trading implication. What moves, what to watch, what's the directional lean. 2–3 sentences. Speak directly to the trader.
- "analysis" MUST be exactly 3 paragraphs separated by \\n\\n. This is the "What This Means For Price" section — the most valuable part:
  Paragraph 1 — IMMEDIATE REACTION: What moves first? Which instruments gap, which spreads widen, which flows trigger. Be specific about direction and magnitude expectations.
  Paragraph 2 — SECOND-ORDER EFFECTS: What does this change downstream? Rate expectations, positioning shifts, sector rotation, cross-asset spillover. Connect the dots the headline-scanners miss.
  Paragraph 3 — TRADE SETUP: Concrete levels, structures, or conditions to watch. "If X holds above Y, look for Z." Give the trader something actionable, not a vague lean.
- No "analysts say", no "experts believe", no hedging filler. No rhetorical questions.
- Tone: tactical, dense, slightly antagonistic — you're briefing experienced traders, not writing a blog post.
- "affects" = list only tickers/instruments that are materially moved (e.g. ["SPX","DXY"]). Max 6.
- "tags": classify what the item is ABOUT — the macro driver (monetary-policy, inflation, geopolitics, ...), the asset class (equities, crypto, forex, commodities, bonds, energy, precious-metals), or the catalyst (earnings, regulation, us-politics). Pick 1–4 that genuinely apply; empty array if none fit. Do not force-fit, and only use tags from the VALID TAGS list below.
- Do NOT fabricate data. If the raw content is thin, keep output proportionally brief — but still hit all 3 paragraphs.`;

const TAGS_LIST = HASHTAGS.join(", ");
const IMPACTS_LIST = IMPACT_LEVELS.join(", ");
const BIAS_LIST = BIAS_LEVELS.join(", ");

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "rephrased", "analysis", "impact", "bias", "affects", "tags"],
  properties: {
    headline: { type: "string", minLength: 1, maxLength: 240 },
    rephrased: { type: "string", minLength: 1 },
    analysis: { type: "string", minLength: 1 },
    impact: { type: "string", enum: [...IMPACT_LEVELS] },
    bias: { type: "string", enum: [...BIAS_LEVELS] },
    affects: { type: "array", items: { type: "string" }, maxItems: 8 },
    tags: {
      type: "array",
      items: { type: "string", enum: [...HASHTAGS] },
      maxItems: 6,
    },
  },
} as const;

interface RephraseResult {
  output: RephraseOutput;
  systemPrompt: string;
  userMessage: string;
  rawResponse: string;
}

export async function rephrase(
  sourceCode: string,
  rawText: string,
  meta?: Record<string, string | number>
): Promise<RephraseResult> {
  const metaBlock = meta
    ? `\n\nMETA (adapter hints, not content):\n${JSON.stringify(meta, null, 2)}`
    : "";

  const user = `SOURCE CODE: [${sourceCode}]
VALID IMPACT VALUES: ${IMPACTS_LIST}
VALID BIAS VALUES: ${BIAS_LIST}
VALID TAGS: ${TAGS_LIST}

RAW CONTENT:
"""
${rawText}
"""${metaBlock}

Return the rewritten item as a single raw JSON object (no markdown, no code fences). Schema: { headline: string, rephrased: string, analysis: string, impact: one of [${IMPACTS_LIST}], bias: one of [${BIAS_LIST}], affects: string[], tags: string[] }`;

  const text = await retry(
    () =>
      ai().chat({
        system: SYSTEM_PROMPT,
        user,
        jsonSchema: { name: "news_item", strict: true, schema: RESPONSE_SCHEMA },
      }),
    {
      label: "llm.rephrase",
      attempts: 3,
      shouldRetry: (err) => {
        const status = (err as { status?: number } | null)?.status;
        if (typeof status === "number") return status >= 500 || status === 429;
        return true;
      },
    }
  );

  const cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  const parsed = RephraseOutputSchema.safeParse(JSON.parse(cleaned));
  if (!parsed.success) {
    logger.error({ errors: parsed.error.format(), raw: cleaned }, "rephrase: invalid output");
    throw new Error("rephrase output failed schema validation");
  }
  return {
    output: parsed.data,
    systemPrompt: SYSTEM_PROMPT,
    userMessage: user,
    rawResponse: cleaned,
  };
}
