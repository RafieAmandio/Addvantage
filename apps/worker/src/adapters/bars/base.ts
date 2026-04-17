/**
 * Provider-agnostic market data (OHLCV bars) adapter.
 *
 * Canonical symbol convention — all callers pass symbols in this form and
 * each concrete adapter translates to the provider's native format internally
 * via its own private `mapSymbol` logic (no shared method required on the
 * interface — providers differ too much to usefully standardize):
 *
 *   - Indices:   `SPX`, `NDX`, `DJI`          (bare, uppercase)
 *   - FX:        `EUR/USD`, `USD/JPY`         (slash-separated, uppercase)
 *   - Crypto:    `BTC/USD`, `ETH/USD`         (slash-separated vs quote currency)
 *   - Equities:  `AAPL`, `MSFT`               (bare ticker, uppercase)
 *
 * Timestamps are ISO 8601 UTC. Intervals match the `instrument_bars.interval`
 * check constraint in migration 0007.
 */

export type Interval = "1m" | "5m" | "1h" | "1d";

export interface Bar {
  /** ISO 8601 UTC, e.g. "2024-01-15T14:30:00Z". */
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  /** Volume is not available for FX and most indices — callers must handle null. */
  volume: number | null;
}

export interface FetchBarsInput {
  /** Canonical symbol (see module doc). */
  symbol: string;
  interval: Interval;
  /** Inclusive lower bound. */
  from: Date;
  /** Inclusive upper bound. */
  to: Date;
}

export interface BarsAdapter {
  /** Stable identifier for the provider, e.g. "twelvedata". */
  readonly code: string;
  /**
   * Fetch OHLCV bars for a symbol/interval in the given date range.
   * Returned array MUST be sorted ascending by `ts` (oldest first).
   */
  fetchBars(input: FetchBarsInput): Promise<Bar[]>;
}
