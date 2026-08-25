import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";

interface ConsultWhatsAppNotification {
  sessionId: string;
  userEmail: string;
  messagePreview: string;
  imageUrl?: string;
}

// Posts a new-consult ping to the TradeVantage WhatsApp group via Jeff's Baileys
// bridge, @-mentioning the configured operators (Anthony). Fire-and-forget:
// no-ops unless the bridge URL + group JID are configured, and every failure is
// swallowed so the consult flow is never blocked by WhatsApp being down.
export async function notifyConsultWhatsApp(
  n: ConsultWhatsAppNotification,
): Promise<void> {
  const base = env.WHATSAPP_BRIDGE_URL?.replace(/\/$/, "");
  const chatId = env.WHATSAPP_CONSULT_GROUP_JID;
  if (!base || !chatId) return;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (env.WHATSAPP_BRIDGE_TOKEN) {
    headers.Authorization = `Bearer ${env.WHATSAPP_BRIDGE_TOKEN}`;
  }

  const mentions = (env.WHATSAPP_CONSULT_MENTION_JIDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const mentionText = env.WHATSAPP_CONSULT_MENTION_TEXT ?? "";

  const preview =
    n.messagePreview.length > 200
      ? n.messagePreview.slice(0, 197) + "..."
      : n.messagePreview;

  const message = [
    "🔔 New TradeVantage consult",
    n.userEmail ? `From: ${n.userEmail}` : "",
    "",
    `"${preview}"`,
    "",
    `${mentionText} ${env.SITE_URL}/admin/consult?sq=${n.sessionId}`.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(`${base}/send`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        chatId,
        message,
        ...(mentions.length ? { mentions } : {}),
      }),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "consult whatsapp: /send rejected");
    }
  } catch (err) {
    logger.warn({ err: String(err) }, "consult whatsapp: /send failed");
  }

  // Forward the attached image as a native WhatsApp image (bridge downloads the URL).
  if (n.imageUrl) {
    try {
      const res = await fetch(`${base}/send-media`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          chatId,
          fileUrl: n.imageUrl,
          mediaType: "image",
          caption: mentionText || undefined,
        }),
      });
      if (!res.ok) {
        logger.warn({ status: res.status }, "consult whatsapp: /send-media rejected");
      }
    } catch (err) {
      logger.warn({ err: String(err) }, "consult whatsapp: /send-media failed");
    }
  }
}
