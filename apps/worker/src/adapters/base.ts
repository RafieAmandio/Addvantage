import type { Impact } from "@tradevantage/shared";
import type { Logger } from "../lib/logger";

/**
 * A `Candidate` is what an adapter hands to the pipeline. It is NOT yet a news
 * item — it still needs dedupe, OpenAI rephrase, and persistence.
 */
export interface Candidate {
  /** Stable identifier inside the source — used with source_code for dedupe. */
  externalId: string;
  sourceUrl: string;
  /** Verbatim content the LLM will rephrase. Don't pre-summarise. */
  rawText: string;
  /** Loose metadata hints the LLM can use (optional). */
  meta?: Record<string, string | number>;
  /** Source publish timestamp if known, else adapter fetch time. */
  occurredAt?: string;
  /**
   * Adapter-level canonical affects[] hint. When set, the persist layer will
   * override the LLM-derived affects with this value — used by deterministic
   * indicator maps (e.g. ForexFactory FOMC → ["SPX","DXY","GOLD","BTC"]) so
   * macro markers filter consistently regardless of the rephrase model's whim.
   */
  canonicalAffects?: string[];
  /** Adapter-level canonical impact hint (overrides LLM when present). */
  canonicalImpact?: Impact;
}

export interface AdapterContext {
  logger: Logger;
  /** Set of content hashes already stored for this source, for fast dedupe. */
  existingHashes: Set<string>;
}

export interface SourceAdapter {
  readonly code: string;
  readonly name: string;
  fetch(ctx: AdapterContext): Promise<Candidate[]>;
}
