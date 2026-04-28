import OpenAI from "openai";
import { env } from "./env.js";

let client: OpenAI | null = null;
let initialised = false;

export function getOpenAI(): OpenAI | null {
  if (initialised) return client;
  initialised = true;
  if (!env.OPENAI_API_KEY) return null;
  client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
}

export const OPENAI_MODEL = env.OPENAI_MODEL;
