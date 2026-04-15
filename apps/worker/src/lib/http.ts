import { logger } from "./logger";

/**
 * Browser-like User-Agent. Many research portals (SPDJI, Yardeni, RBC) 403
 * generic bot strings, so we present as a real Chrome on macOS. We're still
 * a polite crawler — single-digit requests per hour per host.
 */
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Minimal Chrome-ish header set. We intentionally DO NOT send sec-ch-ua /
// sec-fetch-* headers — Cloudflare fingerprinters (SlickCharts, SPDJI) flag a
// mismatch between those headers and the TLS handshake when requests don't
// come from a real browser. A plain UA + accept passes most portals.
const BASE_HEADERS: Record<string, string> = {
  "user-agent": UA,
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "upgrade-insecure-requests": "1",
};

export interface FetchOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  accept?: string;
}

/**
 * Thin wrapper over Node's global fetch. Handles redirects, retries, and
 * browser-like headers. All outbound scraping/API calls go through here.
 */
export async function fetchText(
  url: string,
  opts: FetchOptions = {}
): Promise<string> {
  const { headers = {}, timeoutMs = 20_000, retries = 2, accept } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          ...BASE_HEADERS,
          ...(accept ? { accept } : {}),
          ...headers,
        },
        redirect: "follow",
        signal: ctrl.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return await res.text();
    } catch (err) {
      lastErr = err;
      logger.warn({ url, attempt, err: String(err) }, "http.fetch retry");
      if (attempt < retries) {
        await sleep(500 * Math.pow(2, attempt));
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

export async function fetchJson<T = unknown>(
  url: string,
  opts: FetchOptions = {}
): Promise<T> {
  const text = await fetchText(url, { ...opts, accept: "application/json" });
  return JSON.parse(text) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
