import { type AdapterContext, type Candidate, type SourceAdapter } from "./base";

/**
 * S&P Dow Jones Indices — disabled. All S&P Global properties (spglobal.com,
 * indexologyblog.com, press.spglobal.com) are behind Cloudflare JS challenges
 * that reject plain HTTP clients. No public RSS feed is available.
 *
 * To actually ingest SPDJI you'd need one of:
 *   1. A headless browser (Playwright) that completes the JS challenge.
 *   2. A paid bypass service (FlareSolverr, ScrapFly, Bright Data).
 *   3. An API/data partnership with S&P.
 *
 * The source is disabled in the DB (migration 0006). This adapter exists so
 * the registry stays complete and the scheduler doesn't crash if someone
 * accidentally enables it.
 */
export class SpdjiAdapter implements SourceAdapter {
  readonly code = "SPDJI";
  readonly name = "S&P Dow Jones Indices";

  async fetch(ctx: AdapterContext): Promise<Candidate[]> {
    ctx.logger.info("spdji: adapter disabled — all S&P properties require Cloudflare JS challenge");
    return [];
  }
}
