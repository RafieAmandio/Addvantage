import { logger } from "./lib/logger";
import { config } from "./lib/config";
import { startBot } from "./telegram/bot";
import { startScheduler } from "./scheduler";

/**
 * Worker entrypoint — boots the Telegram bot and the hourly scheduler in the
 * same process. Both are long-lived. A SIGTERM handler ensures graceful exit
 * under docker-compose.
 */
async function main(): Promise<void> {
  logger.info(
    {
      env: config.NODE_ENV,
      model: config.OPENAI_MODEL,
      siteUrl: config.SITE_URL,
    },
    "worker boot"
  );

  // grammY long-polling runs forever; don't await it or we block the scheduler.
  void startBot();

  startScheduler();
  logger.info("scheduler started (hourly)");
}

process.on("SIGTERM", () => {
  logger.info("SIGTERM — shutting down");
  process.exit(0);
});
process.on("SIGINT", () => {
  logger.info("SIGINT — shutting down");
  process.exit(0);
});
process.on("unhandledRejection", (reason) => {
  logger.error({ reason: String(reason) }, "unhandledRejection");
});

main().catch((err) => {
  logger.fatal({ err: String(err) }, "fatal boot error");
  process.exit(1);
});
