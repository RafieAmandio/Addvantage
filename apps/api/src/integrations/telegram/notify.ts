import { prisma } from "@/config/database.js";
import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";

interface ConsultNotification {
  sessionId: string;
  sessionTitle: string;
  userEmail: string;
  messagePreview: string;
}

async function resolveRecipients(): Promise<number[]> {
  const dbAdmins = await prisma.telegramAdmin.findMany({
    where: { active: true },
    select: { tgUserId: true },
  });
  return dbAdmins.map((r) => Number(r.tgUserId)).filter((n) => Number.isFinite(n) && n !== 0);
}

export async function notifyAdminsConsult(notification: ConsultNotification): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const recipients = await resolveRecipients();
  if (recipients.length === 0) return;

  const preview = notification.messagePreview.length > 150
    ? notification.messagePreview.slice(0, 147) + "..."
    : notification.messagePreview;

  const text = [
    `💬 *Consult: New message*`,
    notification.userEmail ? `From: ${notification.userEmail}` : "",
    `Session: ${notification.sessionTitle}`,
    "",
    `"${preview}"`,
    "",
    `${env.SITE_URL}/admin/consult?sq=${notification.sessionId}`,
  ].filter(Boolean).join("\n");

  await Promise.allSettled(
    recipients.map((chatId) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
      }).catch((err) => {
        logger.warn({ chatId, err: String(err) }, "consult notify: send failed");
      })
    )
  );
}
