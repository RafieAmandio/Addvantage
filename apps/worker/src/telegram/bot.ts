import { Bot } from "grammy";
import { prisma } from "@tradevantage/db";
import { config } from "../lib/config";
import { logger } from "../lib/logger";

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
    const pending = await prisma.newsItem.count({
      where: { status: "pending" },
    });
    await ctx.reply(`pending review queue: ${pending}`);
  });

  b.catch((err) => {
    logger.error({ err: String(err.error) }, "telegram bot error");
  });

  _bot = b;
  return _bot;
}

async function isAdminChat(chatId: number): Promise<boolean> {
  if (config.TELEGRAM_ADMIN_CHAT_IDS.includes(String(chatId))) return true;
  const admin = await prisma.telegramAdmin.findFirst({
    where: { tgUserId: BigInt(chatId), active: true },
    select: { tgUserId: true },
  });
  return Boolean(admin);
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
