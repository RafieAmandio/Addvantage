import { supabase } from "../lib/supabase";
import { contentHash } from "../lib/hash";
import { logger } from "../lib/logger";
import { retry } from "../lib/retry";
import { rephrase } from "./rephrase";
import type { Candidate } from "../adapters/base";

export interface PersistResult {
  inserted: number;
  skipped: number;
  rephrased: number;
  errors: number;
  insertedIds: string[];
}

/**
 * Takes fresh Candidates from an adapter and:
 *   1. Computes content_hash.
 *   2. Skips any hash already present (dedupe).
 *   3. Calls OpenAI to rephrase.
 *   4. INSERTs rows with status='pending'.
 * Returns counters + ids the bot can notify on.
 */
export async function persistCandidates(
  sourceCode: string,
  candidates: Candidate[],
  existingHashes: Set<string>
): Promise<PersistResult> {
  const result: PersistResult = {
    inserted: 0,
    skipped: 0,
    rephrased: 0,
    errors: 0,
    insertedIds: [],
  };

  for (const c of candidates) {
    const hash = contentHash([sourceCode, c.externalId, c.rawText]);
    if (existingHashes.has(hash)) {
      result.skipped++;
      continue;
    }
    existingHashes.add(hash);

    let rephrased;
    try {
      rephrased = await rephrase(sourceCode, c.rawText, c.meta);
      result.rephrased++;
    } catch (err) {
      logger.error({ err: String(err), externalId: c.externalId }, "rephrase failed");
      result.errors++;
      continue;
    }

    // Prefer adapter-level canonical hints (e.g. FF indicator map) over
    // LLM-derived affects/impact when present — deterministic taxonomy beats
    // model drift for closed, well-known macro events.
    const affects = c.canonicalAffects ?? rephrased.affects;
    const impact = c.canonicalImpact ?? rephrased.impact;

    const { data, error } = await retry(
      async () =>
        supabase()
          .from("news_items")
          .insert({
            source_code: sourceCode,
            source_url: c.sourceUrl,
            content_hash: hash,
            fetched_at: new Date().toISOString(),
            raw_text: c.rawText,
            headline: rephrased.headline,
            rephrased: rephrased.rephrased,
            analysis: rephrased.analysis,
            impact,
            bias: rephrased.bias,
            affects,
            tags: rephrased.tags,
            author: `[${sourceCode}]`,
            status: "pending",
          })
          .select("id")
          .single(),
      { label: "supabase.news_items.insert", attempts: 3 }
    );

    if (error || !data) {
      logger.error({ err: error?.message, externalId: c.externalId }, "insert failed");
      result.errors++;
      continue;
    }
    result.inserted++;
    result.insertedIds.push(data.id);
  }

  return result;
}

/**
 * Load the set of existing content_hashes for a source so the adapter run can
 * dedupe without one round-trip per candidate.
 */
export async function loadExistingHashes(sourceCode: string): Promise<Set<string>> {
  const { data, error } = await retry(
    async () =>
      supabase()
        .from("news_items")
        .select("content_hash")
        .eq("source_code", sourceCode),
    { label: "supabase.news_items.loadHashes", attempts: 3 }
  );
  if (error) {
    logger.error({ err: error.message, sourceCode }, "loadExistingHashes failed");
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.content_hash as string));
}
