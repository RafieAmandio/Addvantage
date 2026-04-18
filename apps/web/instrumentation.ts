/**
 * Next.js instrumentation hook. Runs once per server/edge process at boot.
 * @sentry/nextjs v8+ loads server/edge Sentry config through this file
 * rather than via auto-discovered `sentry.server.config.ts` at build time.
 * Each imported config module early-returns when its DSN env is unset, so
 * this file is a no-op (aside from the dynamic import) in dev without a DSN.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
