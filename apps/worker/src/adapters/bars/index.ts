import type { BarsAdapter } from "./base";
import { twelveDataAdapter } from "./twelvedata";

/** Registry of all available bars providers, keyed by adapter `code`. */
export const BARS_ADAPTERS: Record<string, BarsAdapter> = {
  [twelveDataAdapter.code]: twelveDataAdapter,
};

/** Look up an adapter by code, throwing a clear error when unknown. */
export function getBarsAdapter(code: string): BarsAdapter {
  const adapter = BARS_ADAPTERS[code];
  if (!adapter) {
    const known = Object.keys(BARS_ADAPTERS).join(", ") || "(none)";
    throw new Error(
      `Unknown bars adapter "${code}". Known adapters: ${known}`
    );
  }
  return adapter;
}

export type { Bar, BarsAdapter, FetchBarsInput, Interval } from "./base";
