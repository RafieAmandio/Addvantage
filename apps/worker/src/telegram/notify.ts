import { bot } from "./bot";
import { config } from "../lib/config";
import { logger } from "../lib/logger";
import { supabase } from "../lib/supabase";

/**
 * Broadcast a "new pending item" message to every whitelisted admin chat.
 * Also pulls admins from the telegram_admins table so you can add reviewers
 * without redeploying.
 */
export async function notifyPending(
  sourceCode: string,
  insertedIds: string[]
): Promise<void> {
  const recipients = await resolveRecipients();
  if (recipients.length === 0) {
    logger.warn({ sourceCode, ids: insertedIds.length }, "notify: no recipients");
    return;
  }

  const summary =
    insertedIds.length === 1
      ? `1 new item from [${sourceCode}] awaits review`
      : `${insertedIds.length} new items from [${sourceCode}] await review`;

  const firstId = insertedIds[0];
  const link = `${config.SITE_URL}/admin/review${firstId ? `/${firstId}` : ""}`;

  const text = `📰 *TradeVantage desk*\n${summary}\n\n${link}`;

  const b = bot();
  for (const chatId of recipients) {
    try {
      await b.api.sendMessage(chatId, text, { parse_mode: "Markdown" });
    } catch (err) {
      logger.warn({ chatId, err: String(err) }, "notify: send failed");
    }
  }
}

async function resolveRecipients(): Promise<number[]> {
  const envIds = config.TELEGRAM_ADMIN_CHAT_IDS.map((s) => Number(s)).filter(
    (n) => Number.isFinite(n) && n !== 0
  );
  const { data } = await supabase()
    .from("telegram_admins")
    .select("tg_user_id")
    .eq("active", true);
  const dbIds = (data ?? []).map((r) => Number(r.tg_user_id));
  return Array.from(new Set([...envIds, ...dbIds]));
}
