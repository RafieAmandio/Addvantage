import * as Sentry from "@sentry/node";
import { prisma } from "@tradevantage/db";
import { logger } from "../lib/logger";
import { config } from "../lib/config";
import { runSource } from "../pipeline/runSource";
import { ADAPTERS } from "../adapters";
import { runRenewalReminders } from "./renewal-reminder";
import { syncTradingEconomicsCalendar } from "../calendar/tradingeconomics";
import { syncRsi } from "../rsi/sync-rsi";

// ---------------------------------------------------------------------------
// Robust minute-aligned scheduler
// ---------------------------------------------------------------------------
// node-cron v3 uses a chained-setTimeout loop inside its Scheduler class.
// If *any* synchronous exception escapes inside that loop the chain breaks
// permanently and the cron task never fires again — with zero indication.
// Docker CPU throttling, event-loop stalls during boot, or time jumps can
// all cause this.  Instead of patching node-cron we replace it with a simple
// setInterval(60_000) that checks the current minute against the schedule.
// setInterval is a single persistent timer (no chain to break), and we wrap
// the body in try/catch so the interval can never be killed by an exception.
// ---------------------------------------------------------------------------

let pollTimer: NodeJS.Timeout | null = null;
let inFlightTick: Promise<void> | null = null;

/** Minute of hour when each job should fire. */
const SCHEDULE = {
  /** Main source ingestion — every hour at :03 */
  sources: { minute: 3, divisorHour: 1 },
  /** TradingEconomics calendar — every 6 hours at :07 */
  calendar: { minute: 7, divisorHour: 6 },
  /** RSI sync — every 4 hours at :10 (requires MARKET_DATA_PROVIDER) */
  rsi: { minute: 10, divisorHour: 4 },
  /** Renewal reminders — daily at 09:00 (requires EMAIL_PROVIDER) */
  renewal: { minute: 0, fixedHour: 9, divisorHour: 24 },
} as const;

type JobName = keyof typeof SCHEDULE;

/** Track which jobs ran at which minute to prevent double-fires. */
const lastFiredAt: Record<JobName, number> = {
  sources: -1,
  calendar: -1,
  rsi: -1,
  renewal: -1,
};

function shouldFire(
  job: JobName,
  now: Date,
): boolean {
  const spec = SCHEDULE[job];
  const minute = now.getMinutes();
  const hour = now.getHours();
  const nowMinuteEpoch = Math.floor(now.getTime() / 60_000);

  // Already fired this exact minute?
  if (lastFiredAt[job] === nowMinuteEpoch) return false;

  if (minute !== spec.minute) return false;
  if ("fixedHour" in spec && hour !== spec.fixedHour) return false;
  if (hour % spec.divisorHour !== 0 && !("fixedHour" in spec)) return false;

  return true;
}

function markFired(job: JobName, now: Date): void {
  lastFiredAt[job] = Math.floor(now.getTime() / 60_000);
}

/**
 * Start the scheduler.  Fires once at boot, then polls every 30 s to
 * check if any job's scheduled minute has arrived.  30 s granularity
 * ensures we never miss a minute boundary even with moderate timer drift.
 */
export function startScheduler(): void {
  // ---- boot-time runs (fire-and-forget) ----
  void tick();

  syncTradingEconomicsCalendar().catch((err) => {
    Sentry.captureException(err, { tags: { scope: "te-calendar.boot" } });
    logger.error({ err: String(err) }, "te-calendar: boot sync failed");
  });

  if (config.MARKET_DATA_PROVIDER) {
    syncRsi().catch((err) => {
      Sentry.captureException(err, { tags: { scope: "rsi-sync.boot" } });
      logger.error({ err: String(err) }, "rsi-sync: boot sync failed");
    });
  }

  if (config.EMAIL_PROVIDER) {
    runRenewalReminders().catch((err) => {
      Sentry.captureException(err, {
        tags: { scope: "renewal-reminder.boot" },
      });
      logger.error(
        { err: String(err) },
        "renewal-reminder: boot run failed",
      );
    });
  }

  // ---- recurring poll (every 30 s) ----
  pollTimer = setInterval(() => {
    try {
      pollJobs();
    } catch (err) {
      // Belt-and-suspenders: never let a throw kill the interval.
      logger.error({ err: String(err) }, "scheduler: poll error");
    }
  }, 30_000);

  logger.info(
    {
      sources: "m3 every 1h",
      calendar: "m7 every 6h",
      rsi: config.MARKET_DATA_PROVIDER ? "m10 every 4h" : "disabled",
      renewal: config.EMAIL_PROVIDER ? "09:00 daily" : "disabled",
    },
    "scheduler: started (setInterval 30s poll)",
  );
}

function pollJobs(): void {
  const now = new Date();

  // -- sources (hourly at :03) --
  if (shouldFire("sources", now)) {
    markFired("sources", now);
    logger.info("scheduler: firing sources tick");
    void tick();
  }

  // -- calendar (every 6h at :07) --
  if (shouldFire("calendar", now)) {
    markFired("calendar", now);
    logger.info("scheduler: firing te-calendar sync");
    syncTradingEconomicsCalendar().catch((err) => {
      Sentry.captureException(err, { tags: { scope: "te-calendar.cron" } });
      logger.error({ err: String(err) }, "te-calendar: scheduled sync failed");
    });
  }

  // -- RSI (every 4h at :10, requires market data) --
  if (config.MARKET_DATA_PROVIDER && shouldFire("rsi", now)) {
    markFired("rsi", now);
    logger.info("scheduler: firing rsi sync");
    syncRsi().catch((err) => {
      Sentry.captureException(err, { tags: { scope: "rsi-sync.cron" } });
      logger.error({ err: String(err) }, "rsi-sync: scheduled sync failed");
    });
  }

  // -- renewal reminders (daily at 09:00, requires email) --
  if (config.EMAIL_PROVIDER && shouldFire("renewal", now)) {
    markFired("renewal", now);
    logger.info("scheduler: firing renewal reminders");
    runRenewalReminders().catch((err) => {
      Sentry.captureException(err, {
        tags: { scope: "renewal-reminder.cron" },
      });
      logger.error(
        { err: String(err) },
        "renewal-reminder: scheduled run failed",
      );
    });
  }
}

/**
 * Stop the poll timer and wait for any in-flight tick to finish so the
 * worker doesn't exit mid-adapter.
 */
export async function stopScheduler(): Promise<void> {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
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
      sources.filter((s) => s.enabled).map((s) => s.code),
    );
    const override = config.ENABLED_SOURCES;
    const codesToRun = override.length > 0 ? override : [...enabledFromDb];

    for (const adapter of ADAPTERS) {
      if (!codesToRun.includes(adapter.code)) continue;
      try {
        await runSource(adapter.code);
      } catch (err) {
        logger.error(
          { sourceCode: adapter.code, err: String(err) },
          "tick: source failed",
        );
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
