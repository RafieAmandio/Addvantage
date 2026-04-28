import OpenAI from "openai";

if (typeof window !== "undefined") {
  throw new Error("lib/openai.ts is server-only");
}

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

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
