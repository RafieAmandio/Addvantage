import * as Sentry from "@sentry/node";
import { config } from "./config";
import { logger } from "./logger";

/**
 * Initialize Sentry for the long-lived worker process. Returns `true` if
 * Sentry was configured (DSN present), `false` otherwise. Call this as early
 * as possible at boot — before adapters/bot/scheduler start — so the
 * OpenTelemetry auto-instrumentation that Sentry ships with can wrap
 * subsequently-imported modules.
 *
 * Graceful no-op when SENTRY_DSN is unset: does nothing, returns false,
 * emits no startup log. Matches the Upstash/Brevo/Heartbeat/Logtail pattern.
 */
export function initSentry(): boolean {
  if (!config.SENTRY_DSN) return false;

  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.SENTRY_ENVIRONMENT ?? config.NODE_ENV,
    tracesSampleRate: config.SENTRY_TRACES_SAMPLE_RATE,
  });

  logger.info(
    {
      environment: config.SENTRY_ENVIRONMENT ?? config.NODE_ENV,
      tracesSampleRate: config.SENTRY_TRACES_SAMPLE_RATE,
    },
    "sentry: reporting enabled"
  );
  return true;
}
