import OpenAI from "openai";

if (typeof window !== "undefined") {
  throw new Error("lib/openai.ts is server-only");
}

/**
 * Shared OpenAI client for the web app (currently used by the consult
 * server action — L1 of the consult LLM carve-up).
 *
 * Mirrors the graceful no-op pattern in `lib/ratelimit.ts`: when
 * `OPENAI_API_KEY` is unset we return `null` so callers can fall back to
 * canned replies without crashing. Keeps dev-without-keys viable.
 */

let client: OpenAI | null = null;
let initialised = false;

export function getOpenAI(): OpenAI | null {
  if (initialised) return client;
  initialised = true;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  client = new OpenAI({ apiKey });
  return client;
}

/**
 * Model id used for consult / chat completions. Matches the worker default so
 * a single `OPENAI_MODEL` env var governs both apps.
 */
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
