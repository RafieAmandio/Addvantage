// TODO(sentry): Source map upload / release tagging is deliberately NOT
// configured here. The Sentry webpack plugin (`withSentryConfig` in
// next.config.js) needs `SENTRY_AUTH_TOKEN` plus a real Sentry org/project,
// which requires the user to create a Sentry account first. Once that's set
// up, wrap next.config.js with `withSentryConfig(...)` and add
// SENTRY_AUTH_TOKEN to CI env. Until then, runtime error capture still works
// fine — unhandled errors are reported as long as the DSN is set. Minified
// stack traces will just lack symbolication.

import * as Sentry from "@sentry/nextjs";

// NEXT_PUBLIC_SENTRY_DSN is the only DSN visible in the browser bundle.
// When unset we early-return — Sentry.init() is never called, no network
// traffic, no console noise. Matches the graceful-noop pattern used by
// Upstash/Brevo/Logtail elsewhere in the app.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0,
  });
}
