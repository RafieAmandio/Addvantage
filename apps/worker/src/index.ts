// Sentry must load before any other side-effectful imports so OpenTelemetry
// auto-instrumentation can wrap them. `initSentry()` itself is a no-op when
// SENTRY_DSN is unset (graceful-noop pattern, like Upstash/Brevo/Logtail).
import { initSentry } from "./lib/sentry";
initSentry();

import { logger } from "./lib/logger";
import { config } from "./lib/config";
import { startBot, stopBot } from "./telegram/bot";
import { startScheduler, stopScheduler } from "./scheduler";
import { startHeartbeat, stopHeartbeat } from "./lib/heartbeat";

/**
 * Worker entrypoint — boots the Telegram bot and the hourly scheduler in the
 * same process. Both are long-lived. SIGTERM/SIGINT trigger an async shutdown
 * that stops the bot's long-poll loop and waits for any in-flight scheduler
 * tick before exiting, with a hard timeout so a stuck adapter can't hang the
 * container forever.
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

  startHeartbeat();
}

const SHUTDOWN_TIMEOUT_MS = 10_000;
let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutdown: starting graceful exit");

  const hardExit = setTimeout(() => {
    logger.warn(
      { timeoutMs: SHUTDOWN_TIMEOUT_MS },
      "shutdown: timeout reached, forcing exit"
    );
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  hardExit.unref();

  try {
    await Promise.allSettled([stopBot(), stopScheduler(), stopHeartbeat()]);
    logger.info("shutdown: complete");
    process.exit(0);
  } catch (err) {
    logger.error({ err: String(err) }, "shutdown: error during shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error({ reason: String(reason) }, "unhandledRejection");
});

main().catch((err) => {
  logger.fatal({ err: String(err) }, "fatal boot error");
  process.exit(1);
});
