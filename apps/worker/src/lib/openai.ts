import OpenAI from "openai";
import { config } from "./config";

let client: OpenAI | null = null;

/**
 * Lazy OpenAI client. Throws with a clear message if the API key isn't set —
 * lets the worker boot without a key for adapter-only smoke tests.
 */
export function openai(): OpenAI {
  if (client) return client;
  if (!config.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set — required for the rephrase pipeline"
    );
  }
  client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  return client;
}
