import * as Sentry from "@sentry/node";
import { prisma } from "@tradevantage/db";
import { logger } from "../lib/logger";
import { config } from "../lib/config";
import { runSource } from "../pipeline/runSource";
import { ADAPTERS } from "../adapters";
import { runRenewalReminders } from "./renewal-reminder";
import { syncTradingEconomicsCalendar } from "../calendar/tradingeconomics";
import { syncRsi } from "../rsi/sync-rsi";
import { syncAtr } from "../atr/sync-atr";
import { syncPolymarketSnapshots, rotatePolymarketSlugs } from "../polymarket/sync";
import { syncGaps } from "../gap-screener/sync-gaps";
import { syncTokenUnlocks } from "../token-unlocks/sync-unlocks";

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

type ScheduleSpec = {
  minute: number;
  divisorHour: number;
  fixedHour?: number;
  fixedHours?: readonly number[];
  timezone?: string;
};

const WIB_TIMEZONE = "Asia/Jakarta";
const WIB_RSI_HOURS = [0, 4, 8, 12, 16, 20] as const;

/** Minute of hour when each job should fire. */
const SCHEDULE = {
  /** Main source ingestion — every hour at :03 */
  sources: { minute: 3, divisorHour: 1 },
  /** TradingEconomics calendar — every 6 hours at :07 */
  calendar: { minute: 7, divisorHour: 6 },
  /** RSI sync — every 4 hours from 08:05 WIB (requires MARKET_DATA_PROVIDER) */
  rsi: { minute: 5, fixedHours: WIB_RSI_HOURS, divisorHour: 4, timezone: WIB_TIMEZONE },
  /** ATR daily levels — every 4 hours at :12 (requires MARKET_DATA_PROVIDER) */
  atr: { minute: 12, divisorHour: 4 },
  /** Renewal reminders — daily at 09:00 (requires EMAIL_PROVIDER) */
  renewal: { minute: 0, fixedHour: 9, divisorHour: 24 },
  /** Gap scanner — every 4 hours at :16 (requires MARKET_DATA_PROVIDER) */
  gap: { minute: 16, divisorHour: 4 },
  /** Polymarket snapshots — every 2 hours at :15 */
  polymarket: { minute: 15, divisorHour: 2 },
  /** Polymarket slug rotation — daily at 06:00 */
  polymarketRotate: { minute: 0, fixedHour: 6, divisorHour: 24 },
  /** Token unlocks — every 12 hours at :20 (free DefiLlama + CoinGecko) */
  unlocks: { minute: 20, divisorHour: 12 },
} satisfies Record<string, ScheduleSpec>;

type JobName = keyof typeof SCHEDULE;

/** Track which jobs ran at which minute to prevent double-fires. */
const lastFiredAt: Record<JobName, number> = {
  sources: -1,
  calendar: -1,
  rsi: -1,
  atr: -1,
  renewal: -1,
  gap: -1,
  polymarket: -1,
  polymarketRotate: -1,
  unlocks: -1,
};

function getJobTimeParts(now: Date, timezone?: string): { hour: number; minute: number } {
  if (!timezone) {
    return { hour: now.getHours(), minute: now.getMinutes() };
  }

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? Number.NaN);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? Number.NaN);

  return { hour, minute };
}

function shouldFire(
  job: JobName,
  now: Date,
): boolean {
  const spec: ScheduleSpec = SCHEDULE[job];
  const { hour, minute } = getJobTimeParts(now, spec.timezone);
  const nowMinuteEpoch = Math.floor(now.getTime() / 60_000);

  // Already fired this exact minute?
  if (lastFiredAt[job] === nowMinuteEpoch) return false;

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;
  if (minute !== spec.minute) return false;
  if (spec.fixedHours && !spec.fixedHours.includes(hour)) return false;
  if (typeof spec.fixedHour === "number" && hour !== spec.fixedHour) return false;
  if (!spec.fixedHours && typeof spec.fixedHour !== "number" && hour % spec.divisorHour !== 0) return false;

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
    syncAtr().catch((err) => {
      Sentry.captureException(err, { tags: { scope: "atr-sync.boot" } });
      logger.error({ err: String(err) }, "atr-sync: boot sync failed");
    });
    syncGaps().catch((err) => {
      Sentry.captureException(err, { tags: { scope: "gap-sync.boot" } });
      logger.error({ err: String(err) }, "gap-sync: boot sync failed");
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

  rotatePolymarketSlugs()
    .then(() => syncPolymarketSnapshots())
    .catch((err) => {
      Sentry.captureException(err, { tags: { scope: "polymarket.boot" } });
      logger.error({ err: String(err) }, "polymarket: boot sync failed");
    });

  syncTokenUnlocks().catch((err) => {
    Sentry.captureException(err, { tags: { scope: "unlocks-sync.boot" } });
    logger.error({ err: String(err) }, "unlocks-sync: boot sync failed");
  });

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
      rsi: config.MARKET_DATA_PROVIDER ? "08:05/12:05/16:05/20:05/00:05/04:05 WIB" : "disabled",
      atr: config.MARKET_DATA_PROVIDER ? "m12 every 4h" : "disabled",
      gap: config.MARKET_DATA_PROVIDER ? "m16 every 4h" : "disabled",
      renewal: config.EMAIL_PROVIDER ? "09:00 daily" : "disabled",
      polymarket: "m15 every 2h",
      polymarketRotate: "06:00 daily",
      unlocks: "m20 every 12h",
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

  // -- RSI (every 4h from 08:05 WIB, requires market data) --
  if (config.MARKET_DATA_PROVIDER && shouldFire("rsi", now)) {
    markFired("rsi", now);
    logger.info("scheduler: firing rsi sync");
    syncRsi().catch((err) => {
      Sentry.captureException(err, { tags: { scope: "rsi-sync.cron" } });
      logger.error({ err: String(err) }, "rsi-sync: scheduled sync failed");
    });
  }

  // -- ATR (every 4h at :12, requires market data) --
  if (config.MARKET_DATA_PROVIDER && shouldFire("atr", now)) {
    markFired("atr", now);
    logger.info("scheduler: firing atr sync");
    syncAtr().catch((err) => {
      Sentry.captureException(err, { tags: { scope: "atr-sync.cron" } });
      logger.error({ err: String(err) }, "atr-sync: scheduled sync failed");
    });
  }

  // -- Gap scanner (every 4h at :16, requires market data) --
  if (config.MARKET_DATA_PROVIDER && shouldFire("gap", now)) {
    markFired("gap", now);
    logger.info("scheduler: firing gap sync");
    syncGaps().catch((err) => {
      Sentry.captureException(err, { tags: { scope: "gap-sync.cron" } });
      logger.error({ err: String(err) }, "gap-sync: scheduled sync failed");
    });
  }

  // -- Token unlocks (every 12h at :20) --
  if (shouldFire("unlocks", now)) {
    markFired("unlocks", now);
    logger.info("scheduler: firing token-unlocks sync");
    syncTokenUnlocks().catch((err) => {
      Sentry.captureException(err, { tags: { scope: "unlocks-sync.cron" } });
      logger.error({ err: String(err) }, "unlocks-sync: scheduled sync failed");
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

  // -- polymarket snapshots (every 2h at :15) --
  if (shouldFire("polymarket", now)) {
    markFired("polymarket", now);
    logger.info("scheduler: firing polymarket snapshot sync");
    syncPolymarketSnapshots().catch((err) => {
      Sentry.captureException(err, { tags: { scope: "polymarket-sync.cron" } });
      logger.error({ err: String(err) }, "polymarket-sync: scheduled run failed");
    });
  }

  // -- polymarket slug rotation (daily at 06:00) --
  if (shouldFire("polymarketRotate", now)) {
    markFired("polymarketRotate", now);
    logger.info("scheduler: firing polymarket slug rotation");
    rotatePolymarketSlugs().catch((err) => {
      Sentry.captureException(err, { tags: { scope: "polymarket-rotate.cron" } });
      logger.error({ err: String(err) }, "polymarket-rotate: scheduled run failed");
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
