import { config } from "./config";

let keys: string[] = [];
let index = 0;

function init(): void {
  const raw = config.MARKET_DATA_API_KEY;
  if (!raw) {
    keys = [];
    return;
  }
  keys = raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

export function getNextApiKey(): string {
  if (keys.length === 0) init();
  if (keys.length === 0)
    throw new Error("No MARKET_DATA_API_KEY configured");
  const key = keys[index % keys.length]!;
  index = (index + 1) % keys.length;
  return key;
}

export function getApiKeyCount(): number {
  if (keys.length === 0) init();
  return keys.length;
}
