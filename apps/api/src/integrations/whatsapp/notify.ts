import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";

interface ConsultWhatsAppNotification {
  sessionId: string;
  userEmail: string;
  messagePreview: string;
  imageUrl?: string;
  // Member opted out of being named — hide identity and flag it for Anthony.
  private?: boolean;
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

  const isImage = Boolean(n.imageUrl);
  const preview =
    n.messagePreview.length > 300
      ? n.messagePreview.slice(0, 297) + "…"
      : n.messagePreview;
  // Keep the full https:// so WhatsApp renders it as a proper tappable link.
  const link = `${env.SITE_URL}/admin/consult?sq=${n.sessionId}`;
  const body = isImage ? "📷 _sent an image_" : `_"${preview}"_`;

  const message = [
    "🔔 *New consult message*",
    "",
    n.private ? "From: 🔒 *Private member*" : `From: ${n.userEmail || "a member"}`,
    n.private ? "🚫 _Asked not to be named, please don't mention them in the group_" : "",
    "",
    body,
    "",
    mentionText.trim(),
    `👉 ${link}`,
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
