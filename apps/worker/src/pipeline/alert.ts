import { config } from "../lib/config";
import { logger } from "../lib/logger";

// ponytail: in-memory throttle, resets on worker restart (one extra ping per deploy).
const THROTTLE_MS = 6 * 60 * 60 * 1000;
let lastSentAt = 0;

/**
 * One WhatsApp ping to the TradeVantage group (via Jeff's bridge, same vars as
 * the api) when a source run fails, at most every 6h across all sources.
 * Fire-and-forget: never throws, no-ops unless the bridge is configured.
 */
export async function alertPipelineDown(sourceCode: string, error: string): Promise<void> {
  const base = config.WHATSAPP_BRIDGE_URL?.replace(/\/$/, "");
  const chatId = config.WHATSAPP_CONSULT_GROUP_JID;
  if (!base || !chatId) return;

  const now = Date.now();
  if (now - lastSentAt < THROTTLE_MS) return;
  lastSentAt = now;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.WHATSAPP_BRIDGE_TOKEN) headers.Authorization = `Bearer ${config.WHATSAPP_BRIDGE_TOKEN}`;

  const message =
    `⚠️ TradeVantage news pipeline is failing\n` +
    `Source: ${sourceCode}\n` +
    `Error: ${error.slice(0, 300)}\n\n` +
    `Details: ${config.SITE_URL}/admin/logs`;

  try {
    const res = await fetch(`${base}/send`, {
      method: "POST",
      headers,
      body: JSON.stringify({ chatId, message }),
    });
    if (!res.ok) logger.warn({ status: res.status }, "alertPipelineDown: /send rejected");
  } catch (err) {
    logger.warn({ err: String(err) }, "alertPipelineDown: /send failed");
  }
}
