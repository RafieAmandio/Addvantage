import { chartRepository } from "./chart.repository.js";

const DEFAULT_LIMIT = 5000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface ListBarsOpts {
  symbol: string;
  interval: string;
  from?: Date;
  to?: Date;
  limit?: number;
}

export const chartService = {
  async listBars(opts: ListBarsOpts) {
    const to = opts.to ?? new Date();
    const from = opts.from ?? new Date(to.getTime() - THIRTY_DAYS_MS);
    const limit = opts.limit ?? DEFAULT_LIMIT;

    const rows = await chartRepository.listBars({
      symbol: opts.symbol,
      interval: opts.interval,
      from,
      to,
      limit,
    });

    const bars = rows.map((r) => ({
      ts: r.ts.toISOString(),
      open: r.open !== null ? Number(r.open) : null,
      high: r.high !== null ? Number(r.high) : null,
      low: r.low !== null ? Number(r.low) : null,
      close: r.close !== null ? Number(r.close) : null,
      volume: r.volume !== null ? Number(r.volume) : null,
    }));

    return {
      symbol: opts.symbol,
      interval: opts.interval,
      from: from.toISOString(),
      to: to.toISOString(),
      bars,
    };
  },
};
