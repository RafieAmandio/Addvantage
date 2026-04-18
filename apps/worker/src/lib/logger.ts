import pino from "pino";
import { config } from "./config";

// Transport targets. Always include stdout; conditionally add dev-pretty and
// Better Stack (Logtail). When LOGTAIL_SOURCE_TOKEN is unset the logger keeps
// its prior behavior (stdout only, with pino-pretty in development) — the
// worker must never crash because of a missing log-forwarding env.
type Target = {
  target: string;
  level: string;
  options: Record<string, unknown>;
};

const isDev = config.NODE_ENV === "development";
const targets: Target[] = [];

if (isDev) {
  // Pretty-printed stdout for local dev.
  targets.push({
    target: "pino-pretty",
    level: config.LOG_LEVEL,
    options: { colorize: true, translateTime: "SYS:HH:MM:ss", destination: 1 },
  });
} else {
  // Plain JSON to stdout in prod-ish envs. `pino/file` with destination=1 is
  // the canonical pino recipe for "write to stdout from a transport thread".
  targets.push({
    target: "pino/file",
    level: config.LOG_LEVEL,
    options: { destination: 1 },
  });
}

if (config.LOGTAIL_SOURCE_TOKEN) {
  targets.push({
    target: "@logtail/pino",
    level: config.LOG_LEVEL,
    options: {
      sourceToken: config.LOGTAIL_SOURCE_TOKEN,
      ...(config.LOGTAIL_ENDPOINT
        ? { options: { endpoint: config.LOGTAIL_ENDPOINT } }
        : {}),
    },
  });
}

export const logger = pino(
  { level: config.LOG_LEVEL, base: { svc: "worker" } },
  pino.transport({ targets })
);

export type Logger = typeof logger;
