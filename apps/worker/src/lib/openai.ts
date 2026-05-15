import OpenAI from "openai";
import { config } from "./config";

const BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  openlimits: "https://openlimits.app/v1",
  moonshot: "https://api.moonshot.ai/v1",
};

let client: OpenAI | null = null;

export function openai(): OpenAI {
  if (client) return client;
  if (!config.LLM_API_KEY) {
    throw new Error(
      "LLM_API_KEY is not set — required for the rephrase pipeline"
    );
  }
  const baseURL = config.LLM_BASE_URL ?? BASE_URLS[config.LLM_PROVIDER];
  client = new OpenAI({ apiKey: config.LLM_API_KEY, baseURL });
  return client;
}
