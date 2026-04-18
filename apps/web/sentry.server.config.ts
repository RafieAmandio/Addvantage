import * as Sentry from "@sentry/nextjs";

// Server-side DSN (not NEXT_PUBLIC_*). Unset = no init, matching the
// graceful-noop pattern used elsewhere.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0,
  });
}
