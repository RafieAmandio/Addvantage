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
