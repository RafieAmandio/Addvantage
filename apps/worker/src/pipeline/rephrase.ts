import { openai as getOpenai } from "../lib/openai";
import { config } from "../lib/config";
import { logger } from "../lib/logger";
import { retry } from "../lib/retry";
import {
  HASHTAGS,
  BIAS_LEVELS,
  IMPACT_LEVELS,
  RephraseOutputSchema,
  type RephraseOutput,
} from "@tradevantage/shared";

const SYSTEM_PROMPT = `You are the editorial desk at TradeVantage (internal codename: ANTS / DOMAIN). You rewrite raw market research into concise, human, trader-facing notes.

RULES:
- Never credit the wire source in the text. The editorial byline is the source code ([FRED], [SC], etc.). Write as if the desk produced the analysis.
- Keep rewrites CONCISE. Headline under 120 chars. Rephrased body 2–4 short sentences. Analysis 1–3 tight sentences explaining what it means for price.
- No "analysts say", no "experts believe", no hedging filler.
- Tone: tactical, dense, slightly antagonistic — addressed to experienced traders.
- "affects" = list only tickers/instruments that are materially moved (e.g. ["SPX","DXY"]). Max 6.
- "tags" must come from the closed taxonomy. Empty array is fine.
- Do NOT fabricate data. If the raw content is thin, keep output thin — don't invent.`;

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

Return the rewritten item as structured JSON matching the schema.`;

  const res = await retry(
    () =>
      getOpenai().chat.completions.create({
        model: config.OPENAI_MODEL,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "news_item",
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
      }),
    {
      label: "openai.rephrase",
      attempts: 3,
      // Don't retry user-error responses (4xx); only transient infra issues.
      shouldRetry: (err) => {
        const status = (err as { status?: number } | null)?.status;
        if (typeof status === "number") return status >= 500 || status === 429;
        return true;
      },
    }
  );

  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error("openai: empty response");

  const parsed = RephraseOutputSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    logger.error({ errors: parsed.error.format(), raw: text }, "rephrase: invalid output");
    throw new Error("rephrase output failed schema validation");
  }
  return {
    output: parsed.data,
    systemPrompt: SYSTEM_PROMPT,
    userMessage: user,
    rawResponse: text,
  };
}
