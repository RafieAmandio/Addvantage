import cron from "node-cron";
import { logger } from "../lib/logger";
import { config } from "../lib/config";
import { supabase } from "../lib/supabase";
import { runSource } from "../pipeline/runSource";
import { ADAPTERS } from "../adapters";

/**
 * Hourly scheduler. Reads the `sources` table for per-source enablement;
 * falls back to ENABLED_SOURCES env override if set.
 */
export function startScheduler(): void {
  // Run every hour at minute 3 to spread load.
  cron.schedule("3 * * * *", async () => {
    await tick();
  });

  // Kick once at boot so the worker is productive immediately.
  void tick();
}

async function tick(): Promise<void> {
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
}
