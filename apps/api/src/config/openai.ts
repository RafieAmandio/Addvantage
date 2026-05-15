import OpenAI from "openai";
import { env } from "./env.js";

const BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  openlimits: "https://openlimits.app/v1",
};

let client: OpenAI | null = null;
let initialised = false;

export function getOpenAI(): OpenAI | null {
  if (initialised) return client;
  initialised = true;
  if (!env.LLM_API_KEY) return null;
  const baseURL = env.LLM_BASE_URL ?? BASE_URLS[env.LLM_PROVIDER];
  client = new OpenAI({ apiKey: env.LLM_API_KEY, baseURL });
  return client;
}

export const LLM_MODEL = env.LLM_MODEL;
