/**
 * Zero-dep JSON logger for the web app (server-side).
 *
 * Pino is intentionally avoided because its `worker_threads` transports
 * collide with Next.js bundling (especially the edge runtime). When we
 * outgrow this, swap the implementation — keep the `logger` surface.
 *
 * Consumers: server components, server actions, route handlers, and
 * any module under `lib/`. Do NOT import from client components.
 */

type Level = "debug" | "info" | "warn" | "error";
type Meta = Record<string, unknown>;

interface Logger {
  debug: (msg: string, meta?: Meta) => void;
  info: (msg: string, meta?: Meta) => void;
  warn: (msg: string, meta?: Meta) => void;
  error: (msg: string, meta?: Meta) => void;
}

// browser no-ops; this is a server-only logger
const noop = () => {};
const noopLogger: Logger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

function makeServerLogger(): Logger {
  const env = process.env.NODE_ENV ?? "development";
  const threshold: Level = env === "development" ? "debug" : "info";
  const order: Record<Level, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
  };
  const min = order[threshold];

  function serializeMeta(meta?: Meta): Meta | undefined {
    if (!meta) return undefined;
    const out: Meta = {};
    for (const [k, v] of Object.entries(meta)) {
      if (v instanceof Error) {
        out[k] = { name: v.name, message: v.message, stack: v.stack };
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  function emit(level: Level, msg: string, meta?: Meta) {
    if (order[level] < min) return;
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      msg,
      app: "web",
      ...(serializeMeta(meta) ?? {}),
    });
    const stream =
      level === "warn" || level === "error" ? process.stderr : process.stdout;
    stream.write(line + "\n");
  }

  return {
    debug: (msg, meta) => emit("debug", msg, meta),
    info: (msg, meta) => emit("info", msg, meta),
    warn: (msg, meta) => emit("warn", msg, meta),
    error: (msg, meta) => emit("error", msg, meta),
  };
}

export const logger: Logger =
  typeof window === "undefined" ? makeServerLogger() : noopLogger;
