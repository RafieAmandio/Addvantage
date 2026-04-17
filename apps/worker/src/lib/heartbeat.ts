import { config } from "./config";
import { logger } from "./logger";

let timer: NodeJS.Timeout | null = null;
let inFlight: Promise<void> | null = null;

/**
 * Periodic outbound liveness ping. Provider-agnostic — just POSTs an empty
 * body to `HEARTBEAT_URL`. Compatible with healthchecks.io, BetterStack,
 * UptimeRobot heartbeat URLs, and any custom endpoint that treats a 200 on
 * a known URL as "the worker is up".
 *
 * No-op when `HEARTBEAT_URL` is unset, so the worker boots fine without it.
 * Failures log a warning but never throw — losing heartbeats must not take
 * the worker down.
 */
export function startHeartbeat(): void {
  if (!config.HEARTBEAT_URL) {
    logger.info("heartbeat: HEARTBEAT_URL not set, skipping");
    return;
  }
  const intervalMs = config.HEARTBEAT_INTERVAL_MIN * 60_000;
  logger.info(
    { url: config.HEARTBEAT_URL, intervalMin: config.HEARTBEAT_INTERVAL_MIN },
    "heartbeat: started"
  );
  // Fire one on boot so the monitor sees us promptly.
  void ping();
  timer = setInterval(() => void ping(), intervalMs);
}

/** Stop the timer and await any in-flight ping. Called from shutdown(). */
export async function stopHeartbeat(): Promise<void> {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (inFlight) {
    try {
      await inFlight;
    } catch {
      // ping() already logs.
    }
  }
}

async function ping(): Promise<void> {
  if (!config.HEARTBEAT_URL) return;
  const run = (async () => {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 5_000);
      const res = await fetch(config.HEARTBEAT_URL!, {
        method: "POST",
        signal: ac.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        logger.warn(
          { status: res.status, url: config.HEARTBEAT_URL },
          "heartbeat: non-2xx response"
        );
      }
    } catch (err) {
      logger.warn({ err: String(err) }, "heartbeat: ping failed");
    }
  })();
  inFlight = run;
  try {
    await run;
  } finally {
    if (inFlight === run) inFlight = null;
  }
}
