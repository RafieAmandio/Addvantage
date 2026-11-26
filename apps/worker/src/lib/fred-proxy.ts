import { config } from "./config";

/**
 * FRED (api.stlouisfed.org and fred.stlouisfed.org) blocks the VPS IP, so FRED calls go
 * through the Cloudflare worker `fred-proxy` when FRED_PROXY_URL and FRED_PROXY_TOKEN are set.
 * The worker maps /api/... to api.stlouisfed.org and /site/... to fred.stlouisfed.org.
 */
export function viaFredProxy(url: string): { url: string; headers: Record<string, string> } {
  if (!config.FRED_PROXY_URL || !config.FRED_PROXY_TOKEN) return { url, headers: {} };
  const base = config.FRED_PROXY_URL.replace(/\/$/, "");
  return {
    url: url.replace("https://api.stlouisfed.org", `${base}/api`).replace("https://fred.stlouisfed.org", `${base}/site`),
    headers: { "x-proxy-token": config.FRED_PROXY_TOKEN },
  };
}
