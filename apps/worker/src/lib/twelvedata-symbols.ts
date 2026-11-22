import { FOREX_PAIRS } from "@tradevantage/shared";

/**
 * Symbols TwelveData's Basic plan answers with 404 ("available starting with the Grow/Pro plan"
 * or "symbol invalid"), checked 2026-11-22. Requesting them every run was ~440 errors a day.
 * ponytail: fixed list; drop it if the plan is upgraded, or compute these from the Yahoo bars instead.
 */
export const TWELVEDATA_UNSUPPORTED = new Set([
  "XAG/USD", "XAU/EUR", "WTI/USD", "HG1", "SPX", "NDX", "DJI", "DXY", "FTSE", "STOXX50E", "FCHI",
]);

/** The FOREX_PAIRS symbols TwelveData can actually serve on the current plan. */
export const twelvedataSymbols = () =>
  FOREX_PAIRS.map((p) => p.symbol).filter((s) => !TWELVEDATA_UNSUPPORTED.has(s));
