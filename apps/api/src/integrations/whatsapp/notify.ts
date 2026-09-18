import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";

// Shared config for Jeff's Baileys bridge → the TradeVantage group. Returns null
// (a no-op) unless the bridge URL + group JID are set. The @Anthony mention env
// is shared across all group pings.
function bridgeConfig() {
  const base = env.WHATSAPP_BRIDGE_URL?.replace(/\/$/, "");
  const chatId = env.WHATSAPP_CONSULT_GROUP_JID;
  if (!base || !chatId) return null;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (env.WHATSAPP_BRIDGE_TOKEN) headers.Authorization = `Bearer ${env.WHATSAPP_BRIDGE_TOKEN}`;

  const mentions = (env.WHATSAPP_CONSULT_MENTION_JIDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const mentionText = env.WHATSAPP_CONSULT_MENTION_TEXT ?? "";

  return { base, chatId, headers, mentions, mentionText };
}

// Post a plain group message (@-mentioning the operators). Fire-and-forget:
// every failure is swallowed so the caller's flow is never blocked.
async function sendGroupText(
  cfg: NonNullable<ReturnType<typeof bridgeConfig>>,
  message: string,
  label: string,
): Promise<void> {
  try {
    const res = await fetch(`${cfg.base}/send`, {
      method: "POST",
      headers: cfg.headers,
      body: JSON.stringify({
        chatId: cfg.chatId,
        message,
        ...(cfg.mentions.length ? { mentions: cfg.mentions } : {}),
      }),
    });
    if (!res.ok) logger.warn({ status: res.status }, `${label}: /send rejected`);
  } catch (err) {
    logger.warn({ err: String(err) }, `${label}: /send failed`);
  }
}

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
  const cfg = bridgeConfig();
  if (!cfg) return;
  const { base, chatId, headers, mentionText } = cfg;

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

  await sendGroupText(cfg, message, "consult whatsapp");

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

interface ApplicationWhatsAppNotification {
  email: string;
  telegramHandle?: string;
  planLabel: string; // e.g. "USDT (TRC20 / Tron) · $850 USDT"
  cashback: boolean;
}

// Pings the group + @-tags Anthony when someone completes an application. Text
// only: the payment proof is PII in a private bucket and is never forwarded.
export async function notifyApplicationWhatsApp(
  n: ApplicationWhatsAppNotification,
): Promise<void> {
  const cfg = bridgeConfig();
  if (!cfg) return;

  const link = `${env.SITE_URL}/admin/early-access`;
  const message = [
    "🎯 *New application*",
    "",
    `Email: ${n.email}`,
    n.telegramHandle ? `Telegram: ${n.telegramHandle}` : "",
    `Plan: ${n.planLabel}`,
    `Cashback: ${n.cashback ? "Yes" : "No"}`,
    "",
    cfg.mentionText.trim(),
    `👉 ${link}`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendGroupText(cfg, message, "application whatsapp");
}
