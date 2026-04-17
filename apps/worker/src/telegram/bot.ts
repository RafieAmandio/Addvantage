import { Bot } from "grammy";
import { config } from "../lib/config";
import { logger } from "../lib/logger";
import { supabase } from "../lib/supabase";

let _bot: Bot | null = null;

/**
 * Lazy grammY bot client. Throws a clear error if `TELEGRAM_BOT_TOKEN` is
 * missing — lets the worker boot for adapter-only tests without a token.
 */
export function bot(): Bot {
  if (_bot) return _bot;
  if (!config.TELEGRAM_BOT_TOKEN) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is not set — required for the Telegram bot"
    );
  }
  const b = new Bot(config.TELEGRAM_BOT_TOKEN);

  b.command("start", async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const ok = await isAdminChat(chatId);
    if (!ok) {
      await ctx.reply(
        `This bot is restricted. Your chat id is ${chatId}. Ask an admin to whitelist you.`
      );
      return;
    }
    await ctx.reply(
      "TradeVantage desk bot online. You will receive pending news notifications here."
    );
  });

  b.command("whoami", async (ctx) => {
    await ctx.reply(`chat_id = ${ctx.chat?.id}`);
  });

  b.command("status", async (ctx) => {
    if (!ctx.chat?.id || !(await isAdminChat(ctx.chat.id))) return;
    const { count: pending } = await supabase()
      .from("news_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    await ctx.reply(`pending review queue: ${pending ?? 0}`);
  });

  b.catch((err) => {
    logger.error({ err: String(err.error) }, "telegram bot error");
  });

  _bot = b;
  return _bot;
}

async function isAdminChat(chatId: number): Promise<boolean> {
  if (config.TELEGRAM_ADMIN_CHAT_IDS.includes(String(chatId))) return true;
  const { data } = await supabase()
    .from("telegram_admins")
    .select("tg_user_id")
    .eq("tg_user_id", chatId)
    .eq("active", true)
    .maybeSingle();
  return Boolean(data);
}

export async function startBot(): Promise<void> {
  const b = bot();
  await b.start({
    onStart: (info) => logger.info({ username: info.username }, "telegram bot started"),
  });
}

/**
 * Stop the long-poll loop if the bot was instantiated. Safe to call when the
 * bot never started (e.g. TELEGRAM_BOT_TOKEN unset).
 */
export async function stopBot(): Promise<void> {
  if (!_bot) return;
  await _bot.stop();
  _bot = null;
}
