import { logger } from "./logger";

export interface RetryOptions {
  /** Total attempts including the first try. Default 3. */
  attempts?: number;
  /** Initial delay before the first retry, in ms. Default 500. */
  baseMs?: number;
  /** Cap any single delay at this many ms. Default 8_000. */
  capMs?: number;
  /** Label used in logger.warn lines so we can grep failures. */
  label?: string;
  /** Return false to abort immediately (e.g. 4xx from a provider). Default: retry everything. */
  shouldRetry?: (err: unknown) => boolean;
}

/**
 * Run `fn` with exponential backoff + full jitter. Re-throws the last error if
 * all attempts fail. Designed for transient network failures against external
 * APIs (OpenAI, Supabase) — do NOT use for operations that are not idempotent
 * unless the caller already protects against duplicates.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const baseMs = opts.baseMs ?? 500;
  const capMs = opts.capMs ?? 8_000;
  const label = opts.label ?? "retry";
  const shouldRetry = opts.shouldRetry ?? (() => true);

  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1 || !shouldRetry(err)) break;
      const expo = Math.min(capMs, baseMs * 2 ** i);
      const delay = Math.floor(Math.random() * expo);
      logger.warn(
        { label, attempt: i + 1, attempts, delayMs: delay, err: String(err) },
        "retry: transient error, will retry"
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
