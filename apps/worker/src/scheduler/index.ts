import cron, { type ScheduledTask } from "node-cron";
import { logger } from "../lib/logger";
import { config } from "../lib/config";
import { supabase } from "../lib/supabase";
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
  // Run every hour at minute 3 to spread load.
  scheduledTask = cron.schedule("3 * * * *", async () => {
    await tick();
  });

  // Kick once at boot so the worker is productive immediately.
  void tick();

  // Daily renewal-reminder cron (09:00 server time) — only when email is
  // configured. We also kick once at boot to mirror the source-poller pattern.
  if (config.EMAIL_PROVIDER) {
    renewalTask = cron.schedule("0 9 * * *", () => {
      runRenewalReminders().catch((err) =>
        logger.error(
          { err: String(err) },
          "renewal-reminder: scheduled run failed"
        )
      );
    });

    runRenewalReminders().catch((err) =>
      logger.error(
        { err: String(err) },
        "renewal-reminder: boot run failed"
      )
    );
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

    const { data: sources } = await supabase()
      .from("sources")
      .select("code,enabled");

    const enabledFromDb = new Set(
      (sources ?? []).filter((s) => s.enabled).map((s) => s.code as string)
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
