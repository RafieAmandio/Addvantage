import cron, { type ScheduledTask } from "node-cron";
import * as Sentry from "@sentry/node";
import { prisma } from "@tradevantage/db";
import { logger } from "../lib/logger";
import { config } from "../lib/config";
import { runSource } from "../pipeline/runSource";
import { ADAPTERS } from "../adapters";
import { runRenewalReminders } from "./renewal-reminder";

let scheduledTask: ScheduledTask | null = null;
let renewalTask: ScheduledTask | null = null;
let inFlightTick: Promise<void> | null = null;

/**
 * Hourly scheduler. Reads the `sources` table for per-source enablement;
 * falls back to ENABLED_SOURCES env override if set.
 *
 * Also registers the daily renewal-reminder cron when EMAIL_PROVIDER is set
 * (E3). Unconfigured envs are a quiet no-op so dev boots cleanly.
 */
export function startScheduler(): void {
  scheduledTask = cron.schedule("3 * * * *", async () => {
    await tick();
  });

  void tick();

  if (config.EMAIL_PROVIDER) {
    renewalTask = cron.schedule("0 9 * * *", () => {
      runRenewalReminders().catch((err) => {
        Sentry.captureException(err, {
          tags: { scope: "renewal-reminder.cron" },
        });
        logger.error(
          { err: String(err) },
          "renewal-reminder: scheduled run failed"
        );
      });
    });

    runRenewalReminders().catch((err) => {
      Sentry.captureException(err, {
        tags: { scope: "renewal-reminder.boot" },
      });
      logger.error(
        { err: String(err) },
        "renewal-reminder: boot run failed"
      );
    });
  }
}

/**
 * Stop the cron task and wait for any in-flight tick to finish so the worker
 * doesn't exit mid-adapter.
 */
export async function stopScheduler(): Promise<void> {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
  if (renewalTask) {
    renewalTask.stop();
    renewalTask = null;
  }
  if (inFlightTick) {
    try {
      await inFlightTick;
    } catch {
      // tick() already logs its own errors; nothing to do here.
    }
  }
}

async function tick(): Promise<void> {
  const run = (async () => {
    logger.info("scheduler tick");

    const sources = await prisma.source.findMany({
      select: { code: true, enabled: true },
    });

    const enabledFromDb = new Set(
      sources.filter((s) => s.enabled).map((s) => s.code)
    );
    const override = config.ENABLED_SOURCES;
    const codesToRun = override.length > 0 ? override : [...enabledFromDb];

    for (const adapter of ADAPTERS) {
      if (!codesToRun.includes(adapter.code)) continue;
      try {
        await runSource(adapter.code);
      } catch (err) {
        logger.error({ sourceCode: adapter.code, err: String(err) }, "tick: source failed");
      }
    }
  })();
  inFlightTick = run;
  try {
    await run;
  } finally {
    if (inFlightTick === run) inFlightTick = null;
  }
}
