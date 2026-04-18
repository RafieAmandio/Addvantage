import * as Sentry from "@sentry/nextjs";

// Edge runtime (middleware, edge route handlers). Same DSN as server;
// early-return keeps the graceful-noop contract when unset.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0,
  });
}
